/**
 * Scoring for the timetable parser evaluation. Pure functions, no I/O.
 *
 * Exams: each predicted exam is matched one-to-one to the expected exam with
 * the most similar subject (ties broken by course code, then date). Matching
 * gives record-level precision, recall and F1; matched pairs are then
 * compared field by field for date, time, course code and venue accuracy.
 *
 * Schedules: a predicted class session counts as correct when its day, start
 * time, end time and subject all match an unused expected session.
 */

const EXAM_FIELDS = ['exam_date', 'exam_time', 'course_code', 'venue'];
const MATCH_THRESHOLD = 0.6;

/** Lowercase, strip accents and punctuation, collapse spaces. */
function normalizeText(value) {
  if (value === null || value === undefined) return null;
  const text = String(value)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  return text || null;
}

/** "CS 210", "cs210", "CS-210" → "cs210". */
function normalizeCode(value) {
  const text = normalizeText(value);
  return text ? text.replace(/ /g, '') : null;
}

/**
 * Normalise a time string to 24-hour HH:MM.
 * Handles "09:00", "9:00 AM", "2:30 pm", "13h30", "8h". Returns null if unparseable.
 */
function normalizeTime(value) {
  if (!value) return null;
  const text = String(value).trim().toLowerCase();
  const match = text.match(/^(\d{1,2})(?:[:h.](\d{2})?)?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const meridiem = match[3]?.[0];
  if (meridiem === 'p' && hour < 12) hour += 12;
  if (meridiem === 'a' && hour === 12) hour = 0;
  if (hour > 23 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/** Token-set Jaccard similarity between two strings, in [0, 1]. */
function similarity(a, b) {
  const tokensA = new Set((normalizeText(a) || '').split(' ').filter(Boolean));
  const tokensB = new Set((normalizeText(b) || '').split(' ').filter(Boolean));
  if (!tokensA.size || !tokensB.size) return 0;
  const shared = [...tokensA].filter((token) => tokensB.has(token)).length;
  return shared / (tokensA.size + tokensB.size - shared);
}

function prf(truePositives, predicted, expected) {
  const precision = predicted ? truePositives / predicted : expected ? 0 : 1;
  const recall = expected ? truePositives / expected : 1;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { precision, recall, f1 };
}

const FIELD_NORMALIZERS = {
  exam_date: (v) => (v ? String(v).slice(0, 10) : null),
  exam_time: normalizeTime,
  course_code: normalizeCode,
  venue: normalizeText,
};

/**
 * Greedily pair predicted and expected exams by descending match score.
 * @returns {[number, number][]} pairs of [predictedIndex, expectedIndex]
 */
function matchExams(predicted, expected) {
  const candidates = [];
  predicted.forEach((p, i) => {
    expected.forEach((e, j) => {
      let score = similarity(p.subject, e.subject);
      if (
        score < MATCH_THRESHOLD &&
        normalizeCode(p.course_code) &&
        normalizeCode(p.course_code) === normalizeCode(e.course_code)
      ) {
        score = MATCH_THRESHOLD;
      }
      if (score >= MATCH_THRESHOLD) {
        const tieBreak =
          (normalizeCode(p.course_code) === normalizeCode(e.course_code) ? 0.01 : 0) +
          (FIELD_NORMALIZERS.exam_date(p.exam_date) === e.exam_date ? 0.01 : 0);
        candidates.push([score + tieBreak, i, j]);
      }
    });
  });
  candidates.sort((a, b) => b[0] - a[0]);

  const usedP = new Set();
  const usedE = new Set();
  const pairs = [];
  for (const [, i, j] of candidates) {
    if (usedP.has(i) || usedE.has(j)) continue;
    usedP.add(i);
    usedE.add(j);
    pairs.push([i, j]);
  }
  return pairs;
}

/**
 * Score one exam-timetable case.
 * @param {object[]} predicted Parser output.
 * @param {object[]} expected Ground truth.
 */
function scoreExamCase(predicted, expected) {
  const pairs = matchExams(predicted, expected);
  const fields = Object.fromEntries(EXAM_FIELDS.map((field) => [field, { correct: 0, total: 0 }]));
  const errors = [];

  for (const [i, j] of pairs) {
    for (const field of EXAM_FIELDS) {
      const normalize = FIELD_NORMALIZERS[field];
      const want = normalize(expected[j][field]);
      const got = normalize(predicted[i][field]);
      fields[field].total += 1;
      if (want === got) fields[field].correct += 1;
      else
        errors.push({
          subject: expected[j].subject,
          field,
          expected: expected[j][field],
          predicted: predicted[i][field],
        });
    }
  }

  const matched = new Set(pairs.map(([, j]) => j));
  expected.forEach((e, j) => {
    if (!matched.has(j))
      errors.push({
        subject: e.subject,
        field: 'record',
        expected: 'present',
        predicted: 'missing',
      });
  });
  const matchedP = new Set(pairs.map(([i]) => i));
  predicted.forEach((p, i) => {
    if (!matchedP.has(i))
      errors.push({ subject: p.subject, field: 'record', expected: 'absent', predicted: 'extra' });
  });

  const exactRecords = pairs.filter(([i, j]) =>
    EXAM_FIELDS.every(
      (f) => FIELD_NORMALIZERS[f](predicted[i][f]) === FIELD_NORMALIZERS[f](expected[j][f]),
    ),
  ).length;

  return {
    counts: {
      predicted: predicted.length,
      expected: expected.length,
      matched: pairs.length,
      exact: exactRecords,
    },
    ...prf(pairs.length, predicted.length, expected.length),
    fields,
    errors,
  };
}

/**
 * Score one weekly-schedule case.
 * @param {Record<string, object[]>} predicted
 * @param {Record<string, object[]>} expected
 */
function scoreScheduleCase(predicted, expected) {
  const key = (day, s) => `${day}|${normalizeTime(s.start)}|${normalizeTime(s.end)}`;
  let predictedCount = 0;
  let expectedCount = 0;
  let correct = 0;
  const errors = [];

  for (const day of Object.keys(expected)) {
    const want = expected[day] || [];
    const got = (predicted && predicted[day]) || [];
    predictedCount += got.length;
    expectedCount += want.length;

    const used = new Set();
    for (const p of got) {
      const index = want.findIndex(
        (e, k) =>
          !used.has(k) &&
          key(day, e) === key(day, p) &&
          similarity(e.subject, p.subject) >= MATCH_THRESHOLD,
      );
      if (index >= 0) {
        used.add(index);
        correct += 1;
      } else {
        errors.push({
          day,
          field: 'session',
          expected: 'absent',
          predicted: `${p.start}-${p.end} ${p.subject}`,
        });
      }
    }
    want.forEach((e, k) => {
      if (!used.has(k))
        errors.push({
          day,
          field: 'session',
          expected: `${e.start}-${e.end} ${e.subject}`,
          predicted: 'missing',
        });
    });
  }

  return {
    counts: {
      predicted: predictedCount,
      expected: expectedCount,
      matched: correct,
      exact: correct,
    },
    ...prf(correct, predictedCount, expectedCount),
    errors,
  };
}

/**
 * Aggregate per-case scores into micro-averaged metrics per document type,
 * plus field accuracy for exams.
 * @param {{ type: 'exam' | 'schedule', score: object }[]} results
 */
function aggregate(results) {
  const summary = {};
  for (const type of ['exam', 'schedule']) {
    const ofType = results.filter((r) => r.type === type && r.score);
    if (!ofType.length) continue;
    const totals = ofType.reduce(
      (acc, { score }) => {
        for (const k of ['predicted', 'expected', 'matched', 'exact']) acc[k] += score.counts[k];
        return acc;
      },
      { predicted: 0, expected: 0, matched: 0, exact: 0 },
    );
    const entry = {
      cases: ofType.length,
      ...totals,
      ...prf(totals.matched, totals.predicted, totals.expected),
      exact_record_rate: totals.expected ? totals.exact / totals.expected : 0,
    };
    if (type === 'exam') {
      entry.field_accuracy = Object.fromEntries(
        EXAM_FIELDS.map((field) => {
          const correct = ofType.reduce((n, r) => n + r.score.fields[field].correct, 0);
          const total = ofType.reduce((n, r) => n + r.score.fields[field].total, 0);
          return [field, total ? correct / total : 0];
        }),
      );
    }
    summary[type] = entry;
  }
  return summary;
}

module.exports = {
  normalizeText,
  normalizeCode,
  normalizeTime,
  similarity,
  matchExams,
  scoreExamCase,
  scoreScheduleCase,
  aggregate,
};

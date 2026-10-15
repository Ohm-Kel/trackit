const {
  normalizeTime,
  normalizeCode,
  similarity,
  scoreExamCase,
  scoreScheduleCase,
  aggregate,
} = require('../../eval/score');

const exam = (overrides = {}) => ({
  subject: 'Calculus II',
  course_code: 'MATH 201',
  exam_date: '2026-12-10',
  exam_time: '09:00',
  venue: 'Hall A',
  ...overrides,
});

describe('normalisers', () => {
  it.each([
    ['09:00', '09:00'],
    ['9:00 AM', '09:00'],
    ['2:30 pm', '14:30'],
    ['12:00 PM', '12:00'],
    ['12:15 am', '00:15'],
    ['13h30', '13:30'],
    ['8h', '08:00'],
    ['noon', null],
    ['25:00', null],
    [null, null],
  ])('normalizeTime(%p) = %p', (input, expected) => {
    expect(normalizeTime(input)).toBe(expected);
  });

  it('normalises course codes and accented text', () => {
    expect(normalizeCode('cs-210')).toBe(normalizeCode('CS 210'));
    expect(similarity('Électromagnétisme', 'electromagnetisme')).toBe(1);
    expect(similarity('Calculus II', 'Linear Algebra')).toBe(0);
  });
});

describe('scoreExamCase', () => {
  it('scores a perfect prediction as 1.0 regardless of formatting', () => {
    const predicted = [exam({ exam_time: '9:00 AM', course_code: 'math201', venue: 'hall a' })];
    const score = scoreExamCase(predicted, [exam()]);
    expect(score.f1).toBe(1);
    expect(score.counts.exact).toBe(1);
    expect(score.errors).toEqual([]);
  });

  it('counts missing and extra records against recall and precision', () => {
    const expected = [exam(), exam({ subject: 'Linear Algebra', course_code: 'MATH 215' })];
    const predicted = [exam(), exam({ subject: 'Quantum Basket Weaving', course_code: null })];
    const score = scoreExamCase(predicted, expected);
    expect(score.precision).toBe(0.5);
    expect(score.recall).toBe(0.5);
    expect(score.errors.map((e) => e.predicted)).toEqual(
      expect.arrayContaining(['missing', 'extra']),
    );
  });

  it('records field errors on matched records', () => {
    const score = scoreExamCase([exam({ exam_date: '2026-10-12' })], [exam()]);
    expect(score.f1).toBe(1);
    expect(score.fields.exam_date).toEqual({ correct: 0, total: 1 });
    expect(score.counts.exact).toBe(0);
  });

  it('matches on course code when the subject is abbreviated', () => {
    const score = scoreExamCase([exam({ subject: 'Calc' })], [exam()]);
    expect(score.counts.matched).toBe(1);
  });

  it('handles empty predictions and empty ground truth', () => {
    expect(scoreExamCase([], [exam()]).recall).toBe(0);
    expect(scoreExamCase([], []).f1).toBe(1);
  });
});

describe('scoreScheduleCase', () => {
  const expected = {
    monday: [{ start: '08:00', end: '10:00', subject: 'CS 230', venue: 'Lab 3' }],
    tuesday: [],
  };

  it('matches sessions by day, time and subject', () => {
    const predicted = {
      monday: [{ start: '8:00', end: '10:00', subject: 'cs 230', venue: null }],
      tuesday: [{ start: '13:00', end: '15:00', subject: 'Extra', venue: null }],
    };
    const score = scoreScheduleCase(predicted, expected);
    expect(score.counts.matched).toBe(1);
    expect(score.precision).toBe(0.5);
    expect(score.recall).toBe(1);
  });

  it('treats a missing schedule as zero recall', () => {
    expect(scoreScheduleCase(undefined, expected).recall).toBe(0);
  });
});

describe('aggregate', () => {
  it('micro-averages across cases and reports field accuracy', () => {
    const perfect = scoreExamCase([exam()], [exam()]);
    const half = scoreExamCase([exam({ venue: 'Hall B' })], [exam(), exam({ subject: 'Physics' })]);
    const summary = aggregate([
      { type: 'exam', score: perfect },
      { type: 'exam', score: half },
      { type: 'exam', score: null },
    ]);

    expect(summary.exam).toMatchObject({ cases: 2, expected: 3, matched: 2, predicted: 2 });
    expect(summary.exam.recall).toBeCloseTo(2 / 3);
    expect(summary.exam.field_accuracy.venue).toBe(0.5);
    expect(summary.schedule).toBeUndefined();
  });
});

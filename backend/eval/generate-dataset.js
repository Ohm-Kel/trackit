#!/usr/bin/env node
/**
 * Generate the synthetic timetable evaluation set with known ground truth.
 *
 * Output: eval/dataset/<version>/{cases/*.pdf|*.png, manifest.json}
 *
 * Every document is produced from a seeded PRNG, so re-running the script
 * reproduces the dataset byte-for-byte (apart from PDF timestamps, which are
 * pinned). Cases vary layout, date and time formats, language, missing
 * fields, distracting text, and rendering (text PDF vs rasterised PNG).
 *
 * PNG variants need `pdftoppm` (poppler-utils). Usage:
 *   node eval/generate-dataset.js [--version v1] [--seed 20261015]
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const PDFDocument = require('pdfkit');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, []),
);
const VERSION = args.version || 'v1';
const SEED = Number(args.seed || 20261015);
const OUT_DIR = path.join(__dirname, 'dataset', VERSION);
const CASES_DIR = path.join(OUT_DIR, 'cases');

// ── Deterministic randomness ────────────────────────────────────────────────

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const pick = (items) => items[Math.floor(rand() * items.length)];
const int = (min, max) => min + Math.floor(rand() * (max - min + 1));
function sample(items, n) {
  const pool = [...items];
  const out = [];
  while (out.length < n && pool.length)
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  return out;
}

// ── Domain data ─────────────────────────────────────────────────────────────

const COURSES = [
  ['MATH 201', 'Calculus II'],
  ['MATH 215', 'Linear Algebra'],
  ['STAT 220', 'Probability and Statistics'],
  ['CS 210', 'Data Structures'],
  ['CS 230', 'Algorithms'],
  ['CS 305', 'Operating Systems'],
  ['CS 320', 'Database Systems'],
  ['CS 340', 'Computer Networks'],
  ['AI 410', 'Machine Learning'],
  ['AI 420', 'Deep Learning'],
  ['AI 430', 'Natural Language Processing'],
  ['EE 250', 'Signals and Systems'],
  ['EE 260', 'Digital Electronics'],
  ['PHYS 150', 'Electromagnetism'],
  ['ECON 110', 'Microeconomics'],
  ['MGT 300', 'Innovation Management'],
  ['FR 101', 'French Language A2'],
  ['ENG 120', 'Technical Writing'],
];
const VENUES = [
  'Hall A',
  'Hall B',
  'Room 101',
  'Room 204',
  'Lab 3',
  'Amphi 2',
  'Salle B12',
  'Main Auditorium',
];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const EN_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const FR_DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const FR_MONTHS = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];
const WEEKDAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const pad = (n) => String(n).padStart(2, '0');

// ── Formatting variants (what the document shows) ───────────────────────────

const DATE_FORMATS = {
  iso: (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
  dmy: (d) => `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`,
  long: (d) =>
    `${EN_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${EN_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  short: (d) =>
    `${pad(d.getUTCDate())}-${EN_MONTHS[d.getUTCMonth()].slice(0, 3)}-${d.getUTCFullYear()}`,
  french: (d) =>
    `${FR_DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${FR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
};
const TIME_FORMATS = {
  h24: (h, m) => `${pad(h)}:${pad(m)}`,
  h12: (h, m) => `${((h + 11) % 12) + 1}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`,
  french: (h, m) => `${h}h${m ? pad(m) : ''}`,
};

// ── Case generation ─────────────────────────────────────────────────────────

function examSession(count, { dropVenue, dropCode }) {
  const start = Date.UTC(2026, 11, 7); // 7 Dec 2026
  const days = sample([...Array(15).keys()], count).sort((a, b) => a - b);
  return sample(COURSES, count).map(([code, subject], i) => {
    const date = new Date(start + days[i] * 86400000);
    const hour = pick([8, 9, 10, 13, 14, 15]);
    const minute = pick([0, 0, 30]);
    return {
      date,
      hour,
      minute,
      truth: {
        subject,
        course_code: dropCode ? null : code,
        exam_date: DATE_FORMATS.iso(date),
        exam_time: `${pad(hour)}:${pad(minute)}`,
        venue: dropVenue && rand() < 0.5 ? null : pick(VENUES),
      },
    };
  });
}

function weeklySchedule() {
  const schedule = Object.fromEntries(WEEKDAYS.map((day) => [day, []]));
  const courses = sample(COURSES, 6);
  for (const day of WEEKDAYS.slice(0, 5)) {
    const slots = sample([8, 10, 13, 15], int(1, 3)).sort((a, b) => a - b);
    for (const hour of slots) {
      const [code, subject] = pick(courses);
      schedule[day].push({
        start: `${pad(hour)}:00`,
        end: `${pad(hour + 2)}:00`,
        subject: rand() < 0.5 ? code : subject,
        venue: rand() < 0.2 ? null : pick(VENUES),
      });
    }
  }
  return schedule;
}

// ── PDF rendering ───────────────────────────────────────────────────────────

function newDoc(file) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 48,
    info: { CreationDate: new Date(Date.UTC(2026, 9, 15)) },
  });
  doc.pipe(fs.createWriteStream(file));
  return doc;
}

function drawTable(doc, headers, rows, widths) {
  const x0 = doc.page.margins.left;
  let y = doc.y + 6;
  const padding = 7;
  const drawRow = (cells, bold) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    // Size the row to its tallest cell so wrapped text never overlaps.
    const rowHeight =
      Math.max(
        ...cells.map((cell, i) => doc.heightOfString(cell ?? '', { width: widths[i] - 8 })),
      ) +
      padding * 2;
    let x = x0;
    cells.forEach((cell, i) => {
      doc.rect(x, y, widths[i], rowHeight).stroke('#999999');
      doc.fillColor('#111111').text(cell ?? '', x + 4, y + padding, { width: widths[i] - 8 });
      x += widths[i];
    });
    y += rowHeight;
  };
  drawRow(headers, true);
  rows.forEach((row) => drawRow(row, false));
  doc.y = y + 10;
  doc.x = x0;
}

function header(doc, title, subtitle) {
  doc.font('Helvetica-Bold').fontSize(15).fillColor('#000000').text(title);
  doc.font('Helvetica').fontSize(10).fillColor('#444444').text(subtitle);
  doc.moveDown(0.6);
}

const NOISE = [
  'Students must arrive 15 minutes before the start of each examination.',
  'Calculators must be non-programmable. Mobile phones are not allowed in the hall.',
  'Results will be published on the student portal in January 2027.',
  'Les étudiants doivent présenter leur carte étudiante à l’entrée.',
];

function renderExamCase(doc, layout, exams, dateFmt, timeFmt, lang) {
  const title =
    lang === 'fr'
      ? 'Calendrier des examens — Semestre 1'
      : 'Examination Timetable — Semester 1, 2026/2027';
  header(
    doc,
    title,
    lang === 'fr'
      ? 'École d’ingénieurs — Session de décembre 2026'
      : 'Faculty of Engineering — December 2026 session',
  );

  const date = (e) => DATE_FORMATS[dateFmt](e.date);
  const time = (e) => TIME_FORMATS[timeFmt](e.hour, e.minute);

  if (layout === 'table') {
    const headers =
      lang === 'fr'
        ? ['Code', 'Matière', 'Date', 'Heure', 'Salle']
        : ['Code', 'Course', 'Date', 'Time', 'Venue'];
    drawTable(
      doc,
      headers,
      exams.map((e) => [
        e.truth.course_code ?? '',
        e.truth.subject,
        date(e),
        time(e),
        e.truth.venue ?? 'TBA',
      ]),
      [60, 170, 140, 60, 70],
    );
  } else if (layout === 'list') {
    doc.font('Helvetica').fontSize(10).fillColor('#111111');
    for (const e of exams) {
      const code = e.truth.course_code ? `${e.truth.course_code} – ` : '';
      const venue = e.truth.venue ? `, ${e.truth.venue}` : '';
      doc.text(`•  ${code}${e.truth.subject}: ${date(e)} at ${time(e)}${venue}`).moveDown(0.3);
    }
  } else {
    // grouped: one heading per date, then the exams on that date
    const byDate = new Map();
    for (const e of exams) {
      const key = date(e);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key).push(e);
    }
    for (const [day, group] of byDate) {
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text(day);
      doc.font('Helvetica').fontSize(10).fillColor('#222222');
      for (const e of group) {
        const parts = [time(e), e.truth.course_code, e.truth.subject, e.truth.venue].filter(
          Boolean,
        );
        doc.text(`   ${parts.join('  |  ')}`);
      }
      doc.moveDown(0.5);
    }
  }

  doc.moveDown(1).font('Helvetica-Oblique').fontSize(8).fillColor('#666666').text(pick(NOISE));
}

function renderScheduleCase(doc, layout, schedule, timeFmt) {
  header(doc, 'Weekly Class Timetable', 'MSc Artificial Intelligence — Semester 1');
  const span = (s) => {
    const [sh] = s.start.split(':').map(Number);
    const [eh] = s.end.split(':').map(Number);
    return `${TIME_FORMATS[timeFmt](sh, 0)} – ${TIME_FORMATS[timeFmt](eh, 0)}`;
  };

  if (layout === 'grid') {
    const slots = [8, 10, 13, 15];
    const days = WEEKDAYS.slice(0, 5);
    const rows = slots.map((hour) => [
      `${TIME_FORMATS[timeFmt](hour, 0)}–${TIME_FORMATS[timeFmt](hour + 2, 0)}`,
      ...days.map((day) => {
        const s = schedule[day].find((x) => x.start === `${pad(hour)}:00`);
        return s ? `${s.subject}${s.venue ? ` (${s.venue})` : ''}` : '';
      }),
    ]);
    drawTable(
      doc,
      ['Time', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      rows,
      [70, 85, 85, 85, 85, 85],
    );
  } else {
    for (const day of WEEKDAYS.slice(0, 5)) {
      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor('#000000')
        .text(day[0].toUpperCase() + day.slice(1));
      doc.font('Helvetica').fontSize(10).fillColor('#222222');
      if (!schedule[day].length) doc.text('   No classes');
      for (const s of schedule[day])
        doc.text(`   ${span(s)}   ${s.subject}${s.venue ? ` — ${s.venue}` : ''}`);
      doc.moveDown(0.4);
    }
  }
}

function finish(doc, pdfPath) {
  return new Promise((resolve) => {
    doc.on('end', resolve);
    doc.end();
  })
    .then(() => new Promise((resolve) => setTimeout(resolve, 50)))
    .then(() => pdfPath);
}

function rasterise(pdfPath) {
  const base = pdfPath.replace(/\.pdf$/, '');
  execFileSync('pdftoppm', ['-png', '-r', '110', '-singlefile', pdfPath, base]);
  fs.unlinkSync(pdfPath);
  return `${base}.png`;
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  fs.rmSync(OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(CASES_DIR, { recursive: true });
  const manifest = {
    version: VERSION,
    seed: SEED,
    generated_by: 'eval/generate-dataset.js',
    cases: [],
  };

  const examSpecs = [];
  for (const layout of ['table', 'list', 'grouped']) {
    for (const dateFmt of ['iso', 'dmy', 'long', 'short'])
      examSpecs.push({ layout, dateFmt, lang: 'en' });
  }
  examSpecs.push(
    { layout: 'table', dateFmt: 'french', lang: 'fr' },
    { layout: 'grouped', dateFmt: 'french', lang: 'fr' },
  );

  for (const [i, spec] of examSpecs.entries()) {
    const id = `exam-${pad(i + 1)}-${spec.layout}-${spec.dateFmt}`;
    const exams = examSession(int(4, 9), { dropVenue: i % 3 === 0, dropCode: i % 5 === 4 });
    const timeFmt = spec.lang === 'fr' ? 'french' : pick(['h24', 'h12']);
    const pdfPath = path.join(CASES_DIR, `${id}.pdf`);
    const doc = newDoc(pdfPath);
    renderExamCase(doc, spec.layout, exams, spec.dateFmt, timeFmt, spec.lang);
    await finish(doc, pdfPath);
    const asImage = i % 3 === 1;
    const file = asImage ? rasterise(pdfPath) : pdfPath;
    manifest.cases.push({
      id,
      type: 'exam',
      file: path.relative(OUT_DIR, file),
      mimeType: asImage ? 'image/png' : 'application/pdf',
      tags: [
        spec.layout,
        `date:${spec.dateFmt}`,
        `time:${timeFmt}`,
        `lang:${spec.lang}`,
        asImage ? 'image' : 'pdf',
      ],
      expected: exams.map((e) => e.truth).sort((a, b) => a.exam_date.localeCompare(b.exam_date)),
    });
  }

  for (let i = 0; i < 6; i += 1) {
    const layout = i % 2 === 0 ? 'grid' : 'by-day';
    const timeFmt = pick(['h24', 'h12']);
    const id = `schedule-${pad(i + 1)}-${layout}`;
    const schedule = weeklySchedule();
    const pdfPath = path.join(CASES_DIR, `${id}.pdf`);
    const doc = newDoc(pdfPath);
    renderScheduleCase(doc, layout, schedule, timeFmt);
    await finish(doc, pdfPath);
    const asImage = i >= 3;
    const file = asImage ? rasterise(pdfPath) : pdfPath;
    manifest.cases.push({
      id,
      type: 'schedule',
      file: path.relative(OUT_DIR, file),
      mimeType: asImage ? 'image/png' : 'application/pdf',
      tags: [layout, `time:${timeFmt}`, asImage ? 'image' : 'pdf'],
      expected: schedule,
    });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(
    `Wrote ${manifest.cases.length} cases to ${path.relative(process.cwd(), OUT_DIR)}\n`,
  );
}

main().catch((err) => {
  process.stderr.write(`${err.stack}\n`);
  process.exit(1);
});

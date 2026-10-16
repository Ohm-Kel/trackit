import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportExamsCSV, exportExamsPDF, exportTasksCSV, exportTasksPDF } from './export';

let downloads;

beforeEach(() => {
  downloads = [];
  // Capture the Blob handed to the download link instead of saving a file.
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    downloads.push(blob);
    return 'blob:test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    downloads.at(-1).filename = this.download;
  });
});
afterEach(() => vi.restoreAllMocks());

const lastCsv = async () => (await downloads.at(-1).text()).split('\n');

describe('CSV export', () => {
  it('writes one row per task and escapes commas, quotes and newlines', async () => {
    exportTasksCSV([
      {
        title: 'Essay, part 1',
        status: 'in_progress',
        due_date: '2026-11-03T12:00:00Z',
        course_code: 'HIST101',
        grade_weight: 20,
        estimated_hours: 6,
        description: 'Use the "primary" sources\nfrom week 3',
      },
      { title: 'Reading', status: 'not_started' },
    ]);

    const [header, first, ...rest] = await lastCsv();
    expect(header).toBe('Title,Status,Due Date,Course Code,Grade Weight (%),Estimated Hours,Description');
    expect(first).toBe('"Essay, part 1",in progress,3 Nov 2026,HIST101,20,6,"Use the ""primary"" sources');
    expect(rest).toEqual(['from week 3"', 'Reading,not started,,,,,']);
    expect(downloads.at(-1).filename).toMatch(/^trackit-tasks-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it('joins exam topics into one cell', async () => {
    exportExamsCSV([
      { subject: 'Calculus', course_code: 'MATH201', confidence_level: 'low', preparation_percent: 40, topics: ['Limits', 'Series'] },
    ]);
    const [, row] = await lastCsv();
    expect(row).toBe('Calculus,MATH201,,low,40,Limits; Series');
  });
});

describe('CSV formula injection', () => {
  it('prefixes cells that a spreadsheet would run as formulas', async () => {
    exportTasksCSV([{ title: '=HYPERLINK("https://evil.example","x")', course_code: '@SUM(A1)', status: 'done', grade_weight: 5 }]);
    const [, row] = await lastCsv();
    expect(row).toBe(`"'=HYPERLINK(""https://evil.example"",""x"")",done,,'@SUM(A1),5,,`);
  });
});

describe('PDF export', () => {
  let written;
  beforeEach(() => {
    written = '';
    vi.spyOn(window, 'open').mockReturnValue({
      document: { write: (html) => (written += html), close: () => {} },
      print: () => {},
    });
  });

  const payload = '<img src=x onerror="alert(document.cookie)">';

  it('escapes task text so it cannot run as script in the print window', () => {
    exportTasksPDF([
      { title: payload, description: payload, course_code: payload, status: '"><script>x</script>' },
    ]);
    expect(written).not.toContain('<img');
    expect(written).not.toContain('<script>x');
    expect(written).toContain('&lt;img src=x onerror=&quot;alert(document.cookie)&quot;&gt;');
    expect(written).toContain('status-not_started');
  });

  it('escapes exam text, including topics', () => {
    exportExamsPDF([
      { subject: payload, course_code: payload, topics: [payload], confidence_level: '"><b>' },
    ]);
    expect(written).not.toContain('<img');
    expect(written).not.toContain('"><b>');
  });

  it('does nothing when the pop-up is blocked', () => {
    window.open.mockReturnValue(null);
    expect(() => exportTasksPDF([{ title: 'x' }])).not.toThrow();
  });
});

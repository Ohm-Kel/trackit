import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportExamsCSV, exportTasksCSV } from './export';

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

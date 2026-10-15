const { computeVelocity, findBurnoutZones } = require('../../lib/analytics');
const { buildSuggestion } = require('../../controllers/notificationController');

const NOW = new Date('2026-10-15T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();
const inDays = (n) => new Date(NOW.getTime() + n * 86400000).toISOString();

describe('computeVelocity', () => {
  it('buckets completed tasks into four weeks, oldest first', () => {
    const report = computeVelocity(
      [
        { completed_at: daysAgo(1) },
        { completed_at: daysAgo(2) },
        { completed_at: daysAgo(10) },
        { completed_at: daysAgo(40) },
        { completed_at: null },
      ],
      NOW,
    );
    expect(report).toHaveLength(4);
    expect(report.map((week) => week.tasks)).toEqual([0, 0, 1, 2]);
    expect(report[3].name).toMatch(/^Week of /);
  });
});

describe('findBurnoutZones', () => {
  it('finds non-overlapping clusters of 3+ deadlines within 48 hours', () => {
    const zones = findBurnoutZones([
      { title: 'A', due_date: '2026-10-20T09:00:00Z' },
      { title: 'B', due_date: '2026-10-21T09:00:00Z' },
      { title: 'C', due_date: '2026-10-22T08:00:00Z' },
      { title: 'D', due_date: '2026-10-22T10:00:00Z' },
      { title: 'E', due_date: '2026-11-01T00:00:00Z' },
      { title: 'No date', due_date: null },
    ]);
    expect(zones).toEqual([
      { start_date: '2026-10-20T09:00:00Z', task_count: 3, tasks: ['A', 'B', 'C'] },
    ]);
  });

  it('returns nothing for sparse deadlines', () => {
    expect(findBurnoutZones([{ title: 'A', due_date: '2026-10-20' }])).toEqual([]);
  });
});

describe('buildSuggestion', () => {
  it('raises a workload alert for 3+ deadlines in the next 4 days', () => {
    const tasks = [1, 2, 3].map((n) => ({ title: `T${n}`, due_date: inDays(n) }));
    expect(buildSuggestion('u1', tasks, NOW)).toMatchObject({
      user_id: 'u1',
      type: 'ai_suggestion',
    });
  });

  it('reminds about the nearest deadline when fewer are due', () => {
    const suggestion = buildSuggestion('u1', [{ title: 'Essay', due_date: inDays(1) }], NOW);
    expect(suggestion.type).toBe('info');
    expect(suggestion.message).toContain('"Essay"');
  });

  it('ignores overdue, undated and distant tasks', () => {
    const tasks = [
      { title: 'Late', due_date: daysAgo(1) },
      { title: 'Undated', due_date: null },
      { title: 'Far', due_date: inDays(10) },
    ];
    expect(buildSuggestion('u1', tasks, NOW)).toBeNull();
  });
});

const ICAL = require('ical.js');
const { buildCalendar } = require('../../lib/calendar');
const { logPath } = require('../../lib/logPath');

const NOW = new Date('2026-10-15T12:00:00Z');
const TASK = {
  id: 'aaaaaaaa-0000-4000-8000-000000000001',
  title: 'Essay',
  description: 'Two pages',
  due_date: '2026-10-20T00:00:00+00:00',
  course_code: 'ENG101',
  status: 'in_progress',
  grade_weight: 30,
  updated_at: '2026-10-10T09:00:00+00:00',
};
const EXAM = {
  id: 'bbbbbbbb-0000-4000-8000-000000000002',
  subject: 'Calculus II',
  course_code: null,
  exam_date: '2026-11-03T09:30:00+00:00',
  topics: ['Series', 'Integrals'],
  updated_at: null,
  created_at: '2026-09-01T00:00:00+00:00',
};

function parse(ics) {
  const events = new ICAL.Component(ICAL.parse(ics)).getAllSubcomponents('vevent');
  return events.map((e) => new ICAL.Event(e));
}

describe('buildCalendar', () => {
  it('makes a date-only due date an all-day event on that date', () => {
    const [event] = parse(buildCalendar({ tasks: [TASK], now: NOW }));
    expect(event.uid).toBe(`trackit-task-${TASK.id}`);
    expect(event.summary).toBe('Due: Essay (ENG101)');
    expect(event.startDate.isDate).toBe(true);
    expect(event.startDate.toString()).toBe('2026-10-20');
    expect(event.endDate.toString()).toBe('2026-10-21');
    expect(event.description).toBe('Two pages\nGrade weight: 30%\nStatus: In progress');
  });

  it('makes an exam with a time a timed event, with its topics', () => {
    const [event] = parse(buildCalendar({ exams: [EXAM], now: NOW }));
    expect(event.uid).toBe(`trackit-exam-${EXAM.id}`);
    expect(event.summary).toBe('Exam: Calculus II');
    expect(event.startDate.isDate).toBe(false);
    expect(event.startDate.toJSDate().toISOString()).toBe('2026-11-03T09:30:00.000Z');
    expect(event.description).toBe('Topics: Series, Integrals');
  });

  it('leaves out done tasks and undated items', () => {
    const events = parse(
      buildCalendar({
        tasks: [
          TASK,
          { ...TASK, id: 'done', status: 'done' },
          { ...TASK, id: 'nodate', due_date: null },
        ],
        exams: [
          EXAM,
          { ...EXAM, id: 'nodate', exam_date: null },
          { ...EXAM, id: 'bad', exam_date: 'x' },
        ],
        now: NOW,
      }),
    );
    expect(events.map((e) => e.uid)).toEqual([
      `trackit-task-${TASK.id}`,
      `trackit-exam-${EXAM.id}`,
    ]);
  });

  it('filters by include and names the calendar to match', () => {
    const tasksOnly = buildCalendar({ tasks: [TASK], exams: [EXAM], include: 'tasks', now: NOW });
    expect(parse(tasksOnly).map((e) => e.uid)).toEqual([`trackit-task-${TASK.id}`]);
    expect(tasksOnly).toContain('X-WR-CALNAME:Trackit tasks');

    const examsOnly = buildCalendar({ tasks: [TASK], exams: [EXAM], include: 'exams', now: NOW });
    expect(parse(examsOnly).map((e) => e.uid)).toEqual([`trackit-exam-${EXAM.id}`]);
  });

  it('stamps events with the last change, so unchanged data gives identical output', () => {
    const first = buildCalendar({ tasks: [TASK], exams: [EXAM], now: NOW });
    const later = buildCalendar({ tasks: [TASK], exams: [EXAM], now: new Date() });
    expect(later).toBe(first);
    expect(first).toContain('DTSTAMP:20261010T090000Z');
    expect(first).toContain('DTSTAMP:20260901T000000Z');

    const bare = buildCalendar({ tasks: [{ ...TASK, updated_at: undefined }], now: NOW });
    expect(bare).toContain('DTSTAMP:20261015T120000Z');
  });

  it('omits a blank description and an unknown status', () => {
    const ics = buildCalendar({
      tasks: [{ ...TASK, description: null, grade_weight: null, status: 'archived' }],
      exams: [{ ...EXAM, topics: null }],
      now: NOW,
    });
    expect(ics).not.toContain('DESCRIPTION:\r\n');
    expect(parse(ics).map((e) => e.description)).toEqual([null, null]);
  });
});

describe('logPath', () => {
  it('hides calendar feed tokens and query strings', () => {
    expect(logPath('/api/calendar/abcDEF_-123.ics?x=1')).toBe('/api/calendar/[token].ics');
    expect(logPath('/calendar/abc.ics')).toBe('/calendar/[token].ics');
    expect(logPath('/api/calendar/export.ics?include=tasks')).toBe('/api/calendar/export.ics');
    expect(logPath('/api/tasks/1?a=b')).toBe('/api/tasks/1');
  });
});

const { serializeCalendar } = require('./ical');

/**
 * Turn tasks and exams into calendar events.
 *
 * Due dates are stored as timestamps, but the app's forms only ever set a
 * date, which Postgres stores as midnight UTC. Such values become all-day
 * events on that date; any other time becomes a timed event.
 */

const STATUS_LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  stuck: 'Stuck',
};

/** @returns {Date | null} */
function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isMidnightUtc(date) {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/** When the record last changed; falls back to `now` for rows without timestamps. */
function stampOf(row, now) {
  return parseDate(row.updated_at) || parseDate(row.created_at) || now;
}

const withCourse = (text, courseCode) => (courseCode ? `${text} (${courseCode})` : text);
const lines = (...parts) => parts.filter(Boolean).join('\n');

/** @returns {import('./ical').CalendarEvent | null} null for done or undated tasks. */
function taskEvent(task, now) {
  const start = parseDate(task.due_date);
  if (!start || task.status === 'done') return null;
  return {
    // Row ids are random UUIDs, so UIDs are unique and stable (RFC 7986 §5.3).
    uid: `trackit-task-${task.id}`,
    start,
    allDay: isMidnightUtc(start),
    summary: withCourse(`Due: ${task.title}`, task.course_code),
    description: lines(
      task.description,
      task.grade_weight !== null && task.grade_weight !== undefined
        ? `Grade weight: ${task.grade_weight}%`
        : null,
      STATUS_LABELS[task.status] && `Status: ${STATUS_LABELS[task.status]}`,
    ),
    categories: ['Trackit task'],
    // A deadline should not mark the whole day as busy.
    transparent: true,
    stamp: stampOf(task, now),
  };
}

/** @returns {import('./ical').CalendarEvent | null} null for undated exams. */
function examEvent(exam, now) {
  const start = parseDate(exam.exam_date);
  if (!start) return null;
  const topics = Array.isArray(exam.topics) ? exam.topics.filter(Boolean) : [];
  return {
    uid: `trackit-exam-${exam.id}`,
    start,
    allDay: isMidnightUtc(start),
    summary: withCourse(`Exam: ${exam.subject}`, exam.course_code),
    description: topics.length ? `Topics: ${topics.join(', ')}` : '',
    categories: ['Trackit exam'],
    stamp: stampOf(exam, now),
  };
}

const NAMES = { all: 'Trackit', tasks: 'Trackit tasks', exams: 'Trackit exams' };

/**
 * Build the iCalendar text for a user's tasks and exams.
 * @param {{ tasks?: object[], exams?: object[], include?: 'all' | 'tasks' | 'exams', now?: Date }} input
 * @returns {string}
 */
function buildCalendar({ tasks = [], exams = [], include = 'all', now = new Date() }) {
  const events = [
    ...(include === 'exams' ? [] : tasks.map((task) => taskEvent(task, now))),
    ...(include === 'tasks' ? [] : exams.map((exam) => examEvent(exam, now))),
  ].filter(Boolean);
  return serializeCalendar({
    name: NAMES[include],
    description: 'Deadlines and exams from Trackit',
    events,
  });
}

module.exports = { buildCalendar, taskEvent, examEvent };

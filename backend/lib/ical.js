/**
 * Minimal RFC 5545 iCalendar writer for the calendar feed and downloads.
 *
 * Only what Trackit needs: one VCALENDAR of VEVENTs, either all-day (DATE
 * values) or timed in UTC. Every text value is escaped and every line folded,
 * because titles and descriptions are user input (and can come from an
 * uploaded timetable).
 */

const CRLF = '\r\n';
// RFC 5545 §3.1: lines SHOULD NOT be longer than 75 octets, excluding CRLF.
const MAX_LINE_OCTETS = 75;

/**
 * Escape a TEXT value (RFC 5545 §3.3.11): backslash, semicolon, comma and line
 * breaks. Other control characters are not allowed in TEXT, so they are
 * dropped rather than passed to calendar apps.
 * @param {unknown} value
 * @returns {string}
 */
function escapeText(value) {
  return (
    String(value)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\r\n|\r|\n/g, '\\n')
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, '')
  );
}

/**
 * Fold a content line into lines of at most 75 octets (RFC 5545 §3.1). Each
 * continuation line starts with a space, which counts towards its length.
 * Iterates by code point, so a multi-byte UTF-8 character is never split.
 * @param {string} line
 * @returns {string}
 */
function foldLine(line) {
  const lines = [];
  let current = '';
  let octets = 0;
  for (const char of line) {
    const size = Buffer.byteLength(char, 'utf8');
    const limit = lines.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (octets + size > limit) {
      lines.push(current);
      current = '';
      octets = 0;
    }
    current += char;
    octets += size;
  }
  lines.push(current);
  return lines.join(`${CRLF} `);
}

const pad = (n) => String(n).padStart(2, '0');

/** @param {Date} date @returns {string} YYYYMMDD of the UTC date. */
function formatDate(date) {
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
}

/** @param {Date} date @returns {string} UTC date-time, e.g. 20261020T140000Z. */
function formatDateTime(date) {
  return `${formatDate(date)}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(
    date.getUTCSeconds(),
  )}Z`;
}

/**
 * @typedef {object} CalendarEvent
 * @property {string} uid Globally unique and stable across feed refreshes.
 * @property {Date} start
 * @property {boolean} allDay Whole-day event on the UTC date of `start`.
 * @property {string} summary
 * @property {string} [description]
 * @property {string[]} [categories]
 * @property {boolean} [transparent] Does not block time in free/busy views.
 * @property {Date} stamp When the source record last changed.
 */

/** @param {CalendarEvent} event @returns {string[]} Unfolded content lines. */
function eventLines(event) {
  const lines = ['BEGIN:VEVENT', `UID:${escapeText(event.uid)}`];
  lines.push(`DTSTAMP:${formatDateTime(event.stamp)}`);
  if (event.allDay) {
    const end = new Date(event.start);
    end.setUTCDate(end.getUTCDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${formatDate(event.start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatDate(end)}`);
  } else {
    // No DTEND: the event takes no time (RFC 5545 §3.6.1), since Trackit
    // does not know how long an exam lasts.
    lines.push(`DTSTART:${formatDateTime(event.start)}`);
  }
  lines.push(`SUMMARY:${escapeText(event.summary)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  if (event.categories?.length) {
    lines.push(`CATEGORIES:${event.categories.map(escapeText).join(',')}`);
  }
  if (event.transparent) lines.push('TRANSP:TRANSPARENT');
  lines.push('END:VEVENT');
  return lines;
}

/**
 * Serialise a calendar. The output depends only on its input, so an unchanged
 * calendar gives an identical body (and ETag) on every refresh.
 * @param {{ name: string, description?: string, events: CalendarEvent[] }} calendar
 * @returns {string}
 */
function serializeCalendar({ name, description, events }) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Trackit//Deadlines and exams//EN',
    'CALSCALE:GREGORIAN',
    `NAME:${escapeText(name)}`,
    `X-WR-CALNAME:${escapeText(name)}`,
  ];
  if (description) {
    lines.push(`DESCRIPTION:${escapeText(description)}`, `X-WR-CALDESC:${escapeText(description)}`);
  }
  // A hint to refresh hourly; Google Calendar ignores it and polls on its own schedule.
  lines.push('REFRESH-INTERVAL;VALUE=DURATION:PT1H', 'X-PUBLISHED-TTL:PT1H');
  for (const event of events) lines.push(...eventLines(event));
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join(CRLF) + CRLF;
}

module.exports = { escapeText, foldLine, formatDate, formatDateTime, serializeCalendar };

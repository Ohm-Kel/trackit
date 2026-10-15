const ICAL = require('ical.js');
const { escapeText, foldLine, serializeCalendar } = require('../../lib/ical');

const STAMP = new Date('2026-10-01T08:30:00Z');

function calendarWith(event) {
  return serializeCalendar({
    name: 'Test',
    events: [
      { uid: 'u1', start: new Date('2026-10-20T00:00:00Z'), allDay: true, stamp: STAMP, ...event },
    ],
  });
}

describe('escapeText', () => {
  it('escapes backslashes, semicolons, commas and line breaks', () => {
    expect(escapeText('a\\b;c,d\ne\r\nf\rg')).toBe('a\\\\b\\;c\\,d\\ne\\nf\\ng');
  });

  it('escapes the backslash first, so escapes are not doubled', () => {
    expect(escapeText('\\n')).toBe('\\\\n');
  });

  it('drops control characters that TEXT values may not contain, but keeps tabs', () => {
    expect(escapeText('a\u0000b\u0007c\u001bd\u007fe\tf')).toBe('abcde\tf');
  });
});

describe('foldLine', () => {
  const octets = (s) => Buffer.byteLength(s, 'utf8');

  it('leaves lines of 75 octets or fewer alone', () => {
    const line = 'x'.repeat(75);
    expect(foldLine(line)).toBe(line);
  });

  it('folds longer lines at 75 octets, continuing with a space', () => {
    const folded = foldLine('x'.repeat(200));
    const lines = folded.split('\r\n');
    expect(lines.map(octets)).toEqual([75, 75, 52]);
    expect(lines.slice(1).every((l) => l.startsWith(' '))).toBe(true);
    expect(folded.replace(/\r\n /g, '')).toBe('x'.repeat(200));
  });

  it('never splits a multi-byte character', () => {
    // 3-octet and 4-octet characters, offset so a naive split would cut one.
    const text = `S${'€'.repeat(40)}${'😀'.repeat(30)}`;
    const lines = foldLine(text).split('\r\n');
    for (const line of lines) {
      expect(octets(line)).toBeLessThanOrEqual(75);
      expect(line).not.toContain('�');
      expect(Buffer.from(line, 'utf8').toString('utf8')).toBe(line);
    }
    expect(lines.map((l, i) => (i ? l.slice(1) : l)).join('')).toBe(text);
  });
});

describe('serializeCalendar', () => {
  it('uses CRLF line endings throughout and ends with CRLF', () => {
    const ics = calendarWith({ summary: 'Essay' });
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/);
  });

  it('round-trips hostile text through a standard parser', () => {
    const summary = 'Due: Essay; part 1, draft \\ final\nBEGIN:VEVENT\r\nUID:evil';
    const description = `${'Long description with a comma, '.repeat(10)}and 😀 emoji`;
    const ics = calendarWith({ summary, description, categories: ['a,b', 'c'] });

    const vcalendar = new ICAL.Component(ICAL.parse(ics));
    const events = vcalendar.getAllSubcomponents('vevent');
    expect(events).toHaveLength(1);
    expect(events[0].getFirstPropertyValue('summary')).toBe(summary.replace(/\r\n/g, '\n'));
    expect(events[0].getFirstPropertyValue('uid')).toBe('u1');
    expect(events[0].getFirstPropertyValue('description')).toBe(description);
    expect(events[0].getFirstProperty('categories').getValues()).toEqual(['a,b', 'c']);
  });

  it('writes all-day events as DATE values ending the next day', () => {
    const ics = calendarWith({ summary: 'x', start: new Date('2026-12-31T00:00:00Z') });
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101\r\n');
  });

  it('writes timed events in UTC without an end', () => {
    const ics = calendarWith({
      summary: 'x',
      allDay: false,
      start: new Date('2026-10-20T09:05:00Z'),
    });
    expect(ics).toContain('DTSTART:20261020T090500Z\r\n');
    expect(ics).not.toContain('DTEND');
  });

  it('includes the calendar description only when given', () => {
    expect(serializeCalendar({ name: 'A', events: [] })).not.toContain('X-WR-CALDESC');
    expect(serializeCalendar({ name: 'A', description: 'B', events: [] })).toContain(
      'X-WR-CALDESC:B\r\n',
    );
  });
});

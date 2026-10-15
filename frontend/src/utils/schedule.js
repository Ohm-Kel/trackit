/** Study windows used when no class schedule has been uploaded. */
export const DEFAULT_SLOTS = [
  { label: 'Morning', time: '9:00 AM – 11:00 AM', start: 9, end: 11 },
  { label: 'Afternoon', time: '2:00 PM – 4:00 PM', start: 14, end: 16 },
  { label: 'Evening', time: '6:00 PM – 8:00 PM', start: 18, end: 20 },
];

export const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_START = 8;
const DAY_END = 21;
const MIN_SLOT_HOURS = 1.5;
const MAX_SLOTS = 4;

/** "14:30" → 14.5, or null if unreadable. */
export function parseTime(str) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(str ?? '').trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours + minutes / 60;
}

/** 14.5 → "2:30 PM". */
export function formatHour(h) {
  const hr = Math.floor(h);
  const min = Math.round((h - hr) * 60);
  const suffix = hr >= 12 ? 'PM' : 'AM';
  const display = hr > 12 ? hr - 12 : hr === 0 ? 12 : hr;
  return `${display}:${String(min).padStart(2, '0')} ${suffix}`;
}

/**
 * Free study windows of at least 1.5 hours between 8:00 and 21:00 on `date`,
 * around the classes in the user's weekly schedule.
 *
 * Without a schedule, or on a day with no classes, the default windows are
 * returned. A day whose classes leave no window returns an empty list, so no
 * study session is ever placed on top of a class.
 *
 * @param {Record<string, { start: string, end: string }[]> | null | undefined} schedule
 * @param {Date} [date]
 */
export function computeFreeSlots(schedule, date = new Date()) {
  if (!schedule) return DEFAULT_SLOTS;

  const classes = schedule[DAY_NAMES[date.getDay()]];
  if (!Array.isArray(classes) || classes.length === 0) return DEFAULT_SLOTS;

  const busy = classes
    .map((c) => ({ start: parseTime(c.start), end: parseTime(c.end) }))
    .filter((c) => c.start !== null && c.end !== null && c.end > c.start)
    .sort((a, b) => a.start - b.start);
  if (busy.length === 0) return DEFAULT_SLOTS;

  const free = [];
  let cursor = DAY_START;
  for (const block of busy) {
    if (block.start - cursor >= MIN_SLOT_HOURS) free.push({ start: cursor, end: block.start });
    cursor = Math.max(cursor, block.end);
  }
  if (DAY_END - cursor >= MIN_SLOT_HOURS) free.push({ start: cursor, end: DAY_END });

  return free.slice(0, MAX_SLOTS).map((slot) => ({
    label: slot.start < 12 ? 'Morning' : slot.start < 17 ? 'Afternoon' : 'Evening',
    time: `${formatHour(slot.start)} – ${formatHour(slot.end)}`,
    start: slot.start,
    end: slot.end,
  }));
}

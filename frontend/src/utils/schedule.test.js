import { describe, expect, it } from 'vitest';
import { DEFAULT_SLOTS, computeFreeSlots, formatHour, parseTime } from './schedule';

const MONDAY = new Date(2026, 9, 12, 7, 0); // Monday 12 October 2026

describe('computeFreeSlots', () => {
  it('uses the default windows without a schedule or on a class-free day', () => {
    expect(computeFreeSlots(null, MONDAY)).toBe(DEFAULT_SLOTS);
    expect(computeFreeSlots({ tuesday: [{ start: '09:00', end: '10:00' }] }, MONDAY)).toBe(DEFAULT_SLOTS);
  });

  it('finds the gaps of at least 1.5 hours around classes, in order', () => {
    const slots = computeFreeSlots(
      {
        monday: [
          { start: '14:00', end: '16:00' },
          { start: '09:30', end: '12:00' },
          { start: '12:30', end: '13:30' }, // leaves only 30 and 30 minutes either side
        ],
      },
      MONDAY,
    );
    expect(slots.map(({ start, end }) => [start, end])).toEqual([
      [8, 9.5], // exactly 1.5 hours still counts
      [16, 21],
    ]);
    expect(slots[0]).toMatchObject({ label: 'Morning', time: '8:00 AM – 9:30 AM' });
    expect(slots[1]).toMatchObject({ label: 'Afternoon', time: '4:00 PM – 9:00 PM' });
  });

  it('handles overlapping classes and early starts', () => {
    const slots = computeFreeSlots(
      {
        monday: [
          { start: '07:00', end: '10:00' },
          { start: '09:00', end: '11:00' },
          { start: '17:00', end: '18:00' },
        ],
      },
      MONDAY,
    );
    expect(slots.map(({ start, end }) => [start, end])).toEqual([
      [11, 17],
      [18, 21],
    ]);
  });

  it('returns no windows for a fully booked day instead of the defaults', () => {
    expect(
      computeFreeSlots({ monday: [{ start: '08:00', end: '12:00' }, { start: '12:30', end: '20:00' }] }, MONDAY),
    ).toEqual([]);
  });

  it('ignores unreadable class times', () => {
    expect(computeFreeSlots({ monday: [{ start: 'TBA', end: '' }] }, MONDAY)).toBe(DEFAULT_SLOTS);
  });
});

describe('time helpers', () => {
  it.each([
    ['09:30', 9.5],
    ['9:05', 9 + 5 / 60],
    ['24:00', null],
    ['noon', null],
    [undefined, null],
  ])('parseTime(%j) = %j', (input, expected) => {
    expect(parseTime(input)).toBe(expected);
  });

  it.each([
    [0, '12:00 AM'],
    [9.5, '9:30 AM'],
    [12, '12:00 PM'],
    [20.25, '8:15 PM'],
  ])('formatHour(%j) = %j', (input, expected) => {
    expect(formatHour(input)).toBe(expected);
  });
});

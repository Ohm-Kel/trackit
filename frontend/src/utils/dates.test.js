import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { daysUntil, formatRelativeDate, formatStatus, getDueBadgeClass, getDueUrgency } from './dates';

// Fixed "now": Wednesday 15 October 2026, mid-afternoon local time.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 15, 15, 30));
});
afterEach(() => vi.useRealTimers());

const local = (day, hour = 9) => new Date(2026, 9, day, hour).toISOString();

describe('daysUntil', () => {
  it('counts whole calendar days, ignoring the time of day', () => {
    expect(daysUntil(local(15, 23))).toBe(0);
    expect(daysUntil(local(16, 0))).toBe(1);
    expect(daysUntil(local(14, 23))).toBe(-1);
    expect(daysUntil(local(25))).toBe(10);
  });

  it('returns null for a missing date', () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil('')).toBeNull();
  });
});

describe('formatRelativeDate', () => {
  it.each([
    [local(10), 'Overdue'],
    [local(15), 'Today'],
    [local(16), 'Tomorrow'],
    [local(21), '6 days'],
    [local(22), '22 Oct'],
    [null, '—'],
  ])('%s → %s', (date, label) => {
    expect(formatRelativeDate(date)).toBe(label);
  });
});

describe('getDueBadgeClass', () => {
  it('escalates from success to warning to error as the date approaches', () => {
    expect(getDueBadgeClass(local(25))).toContain('success');
    expect(getDueBadgeClass(local(19))).toContain('warning');
    expect(getDueBadgeClass(local(16))).toContain('error');
    expect(getDueBadgeClass(local(1))).toContain('error');
    expect(getDueBadgeClass(null)).toContain('text-text-3');
  });
});

describe('formatStatus', () => {
  it('maps database values to labels and passes unknown values through', () => {
    expect(formatStatus('in_progress')).toBe('In Progress');
    expect(formatStatus('archived')).toBe('archived');
    expect(formatStatus(undefined)).toBe('Not Started');
  });
});

describe('getDueUrgency', () => {
  it('ranks overdue, today and tomorrow as urgent, then soon, later and none', () => {
    const inDays = (n) => {
      const d = new Date();
      d.setDate(d.getDate() + n);
      return d.toISOString();
    };
    expect(getDueUrgency(inDays(-3))).toBe('urgent');
    expect(getDueUrgency(inDays(1))).toBe('urgent');
    expect(getDueUrgency(inDays(3))).toBe('soon');
    expect(getDueUrgency(inDays(10))).toBe('later');
    expect(getDueUrgency(null)).toBe('none');
  });
});

/**
 * Shared date utility functions used across Dashboard, Tasks, FocusPlan,
 * Chat, and Analytics. Centralised here to avoid duplicated logic and the
 * Date-mutation bug (Date#setHours mutates in place).
 */

/**
 * Returns the number of whole days between today (midnight) and the given
 * date string (midnight). Negative means the date is in the past (overdue).
 */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86_400_000);
}

/**
 * Returns a human-readable relative date label:
 * "Overdue", "Today", "Tomorrow", "N days", or "D Mon"
 */
export function formatRelativeDate(dateStr) {
  if (!dateStr) return '—';
  const days = daysUntil(dateStr);
  if (days === null) return '—';
  if (days < 0) return 'Overdue';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days <= 6) return `${days} days`;
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Returns a Tailwind class string for a due-date urgency badge.
 */
export function getDueBadgeClass(dateStr) {
  return {
    none: 'bg-bg text-text-3 border border-border',
    urgent: 'bg-error-bg text-error',
    soon: 'bg-warning-bg text-warning',
    later: 'bg-success-bg text-success',
  }[getDueUrgency(dateStr)];
}

/**
 * How pressing a due date is: 'urgent' (overdue, today or tomorrow), 'soon'
 * (within 4 days), 'later', or 'none' without a date. Pages colour by this
 * rather than by reading class names.
 */
export function getDueUrgency(dateStr) {
  const days = daysUntil(dateStr);
  if (days === null) return 'none';
  if (days <= 1) return 'urgent';
  if (days <= 4) return 'soon';
  return 'later';
}

/**
 * Maps a snake_case DB status value to a human-readable label.
 */
export const STATUS_LABELS = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  stuck: 'Stuck',
  done: 'Done',
};

export function formatStatus(status) {
  return STATUS_LABELS[status] || status || 'Not Started';
}

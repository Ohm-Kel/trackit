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
  if (!dateStr) return 'bg-bg text-text-3 border border-border';
  const days = daysUntil(dateStr);
  if (days < 0) return 'bg-[#FEF2F2] text-[#EF4444]';
  if (days <= 1) return 'bg-[#FEF2F2] text-[#EF4444]';
  if (days <= 4) return 'bg-[#FFFBEB] text-[#D97706]';
  return 'bg-[#F0FDF4] text-[#16A34A]';
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

import { apiJson, apiRequest } from './http';
import { API_URL } from './baseUrl';
import { downloadFile } from '../utils/export';

/** @returns {Promise<{ active: boolean, created_at: string | null }>} */
export const fetchCalendarFeed = () =>
  apiJson('/calendar/feed', { fallbackError: 'Failed to load your calendar link' });

/**
 * Create the subscription link, or replace it. The token is only ever
 * returned here: the server keeps just its hash.
 * @returns {Promise<{ token: string, path: string, created_at: string }>}
 */
export const createCalendarFeed = () =>
  apiJson('/calendar/feed', { method: 'POST', fallbackError: 'Failed to create a calendar link' });

export const revokeCalendarFeed = () =>
  apiJson('/calendar/feed', { method: 'DELETE', fallbackError: 'Failed to revoke the calendar link' });

/** Absolute feed URL for a path returned by the API (relative to the API base). */
export function calendarFeedUrl(path) {
  return new URL(`${API_URL}${path}`, window.location.origin).href;
}

/** The same feed as a webcal:// link, which opens the system calendar app. */
export const webcalUrl = (url) => url.replace(/^https?:/, 'webcal:');

/**
 * Download open tasks, exams, or both as a one-off .ics file.
 * @param {'all' | 'tasks' | 'exams'} include
 */
export async function downloadCalendar(include = 'all') {
  const res = await apiRequest(`/calendar/export.ics?include=${include}`, {
    fallbackError: 'Failed to download the calendar file',
  });
  const filename = include === 'all' ? 'trackit.ics' : `trackit-${include}.ics`;
  downloadFile(await res.text(), filename, 'text/calendar;charset=utf-8');
}

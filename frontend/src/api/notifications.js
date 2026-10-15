import { apiJson } from './http';

export const fetchNotifications = () =>
  apiJson('/notifications', { fallbackError: 'Failed to load notifications' });

/** Ask the API to add a workload suggestion if one is due. */
export const generateSuggestions = () =>
  apiJson('/notifications/generate-suggestions', { method: 'POST' });

export const markNotificationRead = (id) =>
  apiJson(`/notifications/${id}/read`, { method: 'PATCH', fallbackError: 'Failed to update notification' });

export const markAllNotificationsRead = () =>
  apiJson('/notifications/read-all', { method: 'PATCH', fallbackError: 'Failed to update notifications' });

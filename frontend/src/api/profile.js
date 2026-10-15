import { apiJson } from './http';

export const fetchProfile = () => apiJson('/users/profile', { fallbackError: 'Failed to load profile' });

export const updateProfile = (updates) =>
  apiJson('/users/profile', { method: 'PATCH', body: updates, fallbackError: 'Failed to update profile' });

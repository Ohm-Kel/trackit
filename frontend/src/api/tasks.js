import { apiJson } from './http';

export const fetchTasks = () => apiJson('/tasks', { fallbackError: 'Failed to fetch tasks' });

export const createTask = (taskData) =>
  apiJson('/tasks', { method: 'POST', body: taskData, fallbackError: 'Failed to create task' });

export const updateTask = (id, updates) =>
  apiJson(`/tasks/${id}`, { method: 'PATCH', body: updates, fallbackError: 'Failed to update task' });

export const deleteTask = (id) =>
  apiJson(`/tasks/${id}`, { method: 'DELETE', fallbackError: 'Failed to delete task' });

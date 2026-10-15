import { apiJson } from './http';

export function fetchSubtasks(parentId, parentType = 'task') {
  const param = parentType === 'task' ? 'task_id' : 'exam_id';
  return apiJson(`/subtasks?${param}=${encodeURIComponent(parentId)}`, {
    fallbackError: 'Failed to fetch subtasks',
  });
}

export const createSubtask = (data) =>
  apiJson('/subtasks', { method: 'POST', body: data, fallbackError: 'Failed to create subtask' });

export const updateSubtask = (id, updates) =>
  apiJson(`/subtasks/${id}`, { method: 'PATCH', body: updates, fallbackError: 'Failed to update subtask' });

export const deleteSubtask = (id) =>
  apiJson(`/subtasks/${id}`, { method: 'DELETE', fallbackError: 'Failed to delete subtask' });

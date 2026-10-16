import { apiJson } from './http';

export const fetchExams = () => apiJson('/exams', { fallbackError: 'Failed to fetch exams' });

export const createExam = (examData) =>
  apiJson('/exams', { method: 'POST', body: examData, fallbackError: 'Failed to create exam' });

export const updateExam = (id, updates) =>
  apiJson(`/exams/${id}`, { method: 'PATCH', body: updates, fallbackError: 'Failed to update exam' });

export const deleteExam = (id) =>
  apiJson(`/exams/${id}`, { method: 'DELETE', fallbackError: 'Failed to delete exam' });

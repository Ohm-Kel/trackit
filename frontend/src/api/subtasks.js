import { supabase } from '../lib/supabaseClient';
import { API_URL } from './baseUrl';


async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export async function fetchSubtasks(parentId, parentType = 'task') {
  const headers = await getAuthHeader();
  const param = parentType === 'task' ? `task_id=${parentId}` : `exam_id=${parentId}`;
  const res = await fetch(`${API_URL}/subtasks?${param}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch subtasks');
  return res.json();
}

export async function createSubtask(data) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create subtask');
  return res.json();
}

export async function updateSubtask(id, updates) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/subtasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Failed to update subtask');
  return res.json();
}

export async function deleteSubtask(id) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/subtasks/${id}`, {
    method: 'DELETE',
    headers,
  });
  if (!res.ok) throw new Error('Failed to delete subtask');
  return res.json();
}

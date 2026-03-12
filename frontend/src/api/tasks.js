import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.PROD 
  ? '/api' 
  : import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { 'Authorization': `Bearer ${session.access_token}` };
}

export async function fetchTasks() {
  const url = new URL(`${API_URL}/tasks`);
  const headers = await getAuthHeader();

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return await res.json();
}

export async function createTask(taskData) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function updateTask(id, updates) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function deleteTask(id) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return await res.json();
}

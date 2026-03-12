const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';



export async function fetchTasks(userId) {
  const url = new URL(`${API_URL}/tasks`);
  if (userId) url.searchParams.append('user_id', userId);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return await res.json();
}

export async function createTask(taskData) {
  const res = await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskData)
  });
  if (!res.ok) throw new Error('Failed to create task');
  return await res.json();
}

export async function updateTask(id, updates) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update task');
  return await res.json();
}

export async function deleteTask(id) {
  const res = await fetch(`${API_URL}/tasks/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete task');
  return await res.json();
}

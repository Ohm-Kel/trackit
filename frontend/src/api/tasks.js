const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fallback mock data if backend fails (since Supabase keys are pending)
const MOCK_TASKS = [
  {
    id: '1',
    title: 'Data Structures — Assignment 3',
    description: 'Due in 24hrs, worth 25% grade, only 40% done',
    course_code: 'CS 301',
    due_date: new Date(Date.now() + 86400000).toISOString(),
    grade_weight: 25,
    estimated_hours: 4,
    status: 'In Progress',
    priority_score: 95
  },
  {
    id: '2',
    title: 'Business Law — Case Study Analysis',
    description: '4 days away, 30% grade weight, not started yet',
    course_code: 'BL 202',
    due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    grade_weight: 30,
    estimated_hours: 5,
    status: 'Not started',
    priority_score: 80
  },
  {
    id: '3',
    title: 'Database Systems — Lab Report',
    description: 'Same week as Law case study — start today',
    course_code: 'DB 401',
    due_date: new Date(Date.now() + 86400000 * 4).toISOString(),
    grade_weight: 20,
    estimated_hours: 3,
    status: 'In Progress',
    priority_score: 75
  }
];

export async function fetchTasks(userId) {
  try {
    const url = new URL(`${API_URL}/tasks`);
    if (userId) url.searchParams.append('user_id', userId);

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return await res.json();
  } catch (error) {
    console.warn("Backend fetch failed, using mock data. Ensure Supabase keys are configured:", error);
    return MOCK_TASKS;
  }
}

export async function createTask(taskData) {
  try {
    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error('Failed to create task');
    return await res.json();
  } catch (error) {
    console.warn("Backend fetch failed, returning mock success:", error);
    return { id: Math.random().toString(), ...taskData };
  }
}

export async function updateTask(id, updates) {
  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update task');
    return await res.json();
  } catch (error) {
    console.warn("Backend fetch failed, returning mock success:", error);
    return { id, ...updates };
  }
}

export async function deleteTask(id) {
  try {
    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return await res.json();
  } catch (error) {
    console.warn("Backend fetch failed, returning mock success:", error);
    return { message: 'Deleted mock task' };
  }
}

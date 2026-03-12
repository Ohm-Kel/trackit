const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';



export async function fetchExams(userId) {
  const url = new URL(`${API_URL}/exams`);
  if (userId) url.searchParams.append('user_id', userId);

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch exams');
  return await res.json();
}

export async function createExam(examData) {
  const res = await fetch(`${API_URL}/exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(examData)
  });
  if (!res.ok) throw new Error('Failed to create exam');
  return await res.json();
}

export async function updateExam(id, updates) {
  const res = await fetch(`${API_URL}/exams/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update exam');
  return await res.json();
}

export async function deleteExam(id) {
  const res = await fetch(`${API_URL}/exams/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete exam');
  return await res.json();
}

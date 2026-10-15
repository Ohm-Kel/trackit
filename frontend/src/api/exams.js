import { supabase } from '../lib/supabaseClient';
import { API_URL } from './baseUrl';


async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { 'Authorization': `Bearer ${session.access_token}` };
}

export async function fetchExams() {
  const url = new URL(`${API_URL}/exams`);
  const headers = await getAuthHeader();

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error('Failed to fetch exams');
  return await res.json();
}

export async function createExam(examData) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/exams`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(examData)
  });
  if (!res.ok) throw new Error('Failed to create exam');
  return await res.json();
}

export async function updateExam(id, updates) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/exams/${id}`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      ...headers
    },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Failed to update exam');
  return await res.json();
}

export async function deleteExam(id) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/exams/${id}`, {
    method: 'DELETE',
    headers
  });
  if (!res.ok) throw new Error('Failed to delete exam');
  return await res.json();
}

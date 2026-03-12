const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Fallback mock data if backend fails (since Supabase keys are pending)
const MOCK_EXAMS = [
  {
    id: 'e1',
    subject: 'Data Structures',
    course_code: 'CS 301',
    exam_date: new Date(Date.now() + 86400000 * 23).toISOString().split('T')[0],
    confidence_level: 'medium',
    daily_study_hours: 2,
    topics: ['Arrays', 'Linked lists', 'Graph traversal', 'Sorting algorithms'],
    preparation_percent: 35
  },
  {
    id: 'e2',
    subject: 'Business Law',
    course_code: 'BL 202',
    exam_date: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
    confidence_level: 'low',
    daily_study_hours: 1.5,
    topics: ['Contract law', 'Tort law', 'Corporate law', 'Case studies'],
    preparation_percent: 15
  }
];

export async function fetchExams(userId) {
  try {
    const url = new URL(`${API_URL}/exams`);
    if (userId) url.searchParams.append('user_id', userId);

    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch exams');
    return await res.json();
  } catch (error) {
    console.warn('Backend fetch failed, using mock exam data:', error);
    return MOCK_EXAMS;
  }
}

export async function createExam(examData) {
  try {
    const res = await fetch(`${API_URL}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(examData)
    });
    if (!res.ok) throw new Error('Failed to create exam');
    return await res.json();
  } catch (error) {
    console.warn('Backend fetch failed, returning mock success:', error);
    return { id: `e-${Math.random().toString(36).slice(2)}`, ...examData };
  }
}

export async function updateExam(id, updates) {
  try {
    const res = await fetch(`${API_URL}/exams/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (!res.ok) throw new Error('Failed to update exam');
    return await res.json();
  } catch (error) {
    console.warn('Backend fetch failed, returning mock success:', error);
    return { id, ...updates };
  }
}

export async function deleteExam(id) {
  try {
    const res = await fetch(`${API_URL}/exams/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete exam');
    return await res.json();
  } catch (error) {
    console.warn('Backend fetch failed, returning mock success:', error);
    return { message: 'Deleted mock exam' };
  }
}

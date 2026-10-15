import { supabase } from '../lib/supabaseClient';
import { API_URL } from './baseUrl';


async function getAuthHeader() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

/**
 * Read a File as base64 string (without the data: prefix).
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      // Strip the "data:...;base64," prefix
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload and parse a timetable file with AI.
 * @param {File} file
 * @param {'exam'|'schedule'} type
 */
export async function parseUpload(file, type) {
  const base64 = await fileToBase64(file);
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/upload/parse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ file: base64, mimeType: file.type, type }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to parse document');
  }
  return res.json();
}

/**
 * Bulk-import parsed exams.
 * @param {Array} exams
 */
export async function importExams(exams) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/upload/import-exams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ exams }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to import exams');
  }
  return res.json();
}

/**
 * Save parsed weekly schedule.
 * @param {Object} schedule
 */
export async function saveSchedule(schedule) {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}/upload/save-schedule`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ schedule }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to save schedule');
  }
  return res.json();
}

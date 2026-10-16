import { apiJson } from './http';

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
 * @returns {Promise<{ type: string, data: unknown, warnings: string[] }>}
 */
export async function parseUpload(file, type) {
  const base64 = await fileToBase64(file);
  return apiJson('/upload/parse', {
    method: 'POST',
    body: { file: base64, mimeType: file.type, type },
    fallbackError: 'Failed to parse document',
  });
}

/**
 * Bulk-import parsed exams.
 * @param {Array} exams
 */
export const importExams = (exams) =>
  apiJson('/upload/import-exams', { method: 'POST', body: { exams }, fallbackError: 'Failed to import exams' });

/**
 * Save parsed weekly schedule.
 * @param {Object} schedule
 */
export const saveSchedule = (schedule) =>
  apiJson('/upload/save-schedule', { method: 'POST', body: { schedule }, fallbackError: 'Failed to save schedule' });

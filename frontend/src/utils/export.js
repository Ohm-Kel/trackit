/**
 * Export utilities — CSV and PDF download for tasks and exams.
 * PDF uses a simple HTML-to-print approach (no extra dependencies).
 */

function escapeCSV(value) {
  if (value == null) return '';
  let str = String(value);
  // Text starting with these characters runs as a formula in Excel and
  // Sheets; prefix it so it stays text (OWASP CSV injection guidance).
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── CSV Exports ───

export function exportTasksCSV(tasks) {
  const headers = ['Title', 'Status', 'Due Date', 'Course Code', 'Grade Weight (%)', 'Estimated Hours', 'Description'];
  const rows = tasks.map(t => [
    escapeCSV(t.title),
    escapeCSV(t.status?.replace('_', ' ')),
    escapeCSV(formatDate(t.due_date)),
    escapeCSV(t.course_code),
    escapeCSV(t.grade_weight),
    escapeCSV(t.estimated_hours),
    escapeCSV(t.description),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `trackit-tasks-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

export function exportExamsCSV(exams) {
  const headers = ['Subject', 'Course Code', 'Exam Date', 'Confidence', 'Preparation (%)', 'Topics'];
  const rows = exams.map(e => [
    escapeCSV(e.subject),
    escapeCSV(e.course_code),
    escapeCSV(formatDate(e.exam_date)),
    escapeCSV(e.confidence_level),
    escapeCSV(e.preparation_percent),
    escapeCSV(Array.isArray(e.topics) ? e.topics.join('; ') : ''),
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  downloadFile(csv, `trackit-exams-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');
}

// ─── PDF Export (print-based, no dependencies) ───

/**
 * Escape text for HTML. The print window shares this page's origin, so any
 * unescaped task or exam text (which can come from an uploaded timetable)
 * would run as script with access to the user's session.
 */
function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[ch]);
}

function openPrintWindow(html) {
  const win = window.open('', '_blank');
  if (!win) return; // Pop-up blocked.
  win.document.write(html);
  win.document.close();
  win.print();
}

const STATUS_CLASSES = ['not_started', 'in_progress', 'stuck', 'done'];

function buildPrintHTML(title, tableHeaders, tableRows) {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title} — Trackit</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a1a; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #4F46E5; }
        .header h1 { font-size: 22px; color: #4F46E5; }
        .header .date { font-size: 12px; color: #666; }
        .header .brand { font-size: 11px; color: #999; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background: #F8FAFC; color: #475569; text-transform: uppercase; font-size: 10px; font-weight: 700; letter-spacing: 0.05em; padding: 10px 12px; text-align: left; border-bottom: 2px solid #E2E8F0; }
        td { padding: 10px 12px; border-bottom: 1px solid #F1F5F9; vertical-align: top; }
        tr:nth-child(even) { background: #FAFBFC; }
        .status { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
        .status-done { background: #F0FDF4; color: #16A34A; }
        .status-in_progress { background: #EEF2FF; color: #4F46E5; }
        .status-stuck { background: #FEF2F2; color: #EF4444; }
        .status-not_started { background: #F8FAFC; color: #94A3B8; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #999; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <div class="date">Exported on ${today}</div>
        </div>
        <div class="brand">Trackit</div>
      </div>
      <table>
        <thead><tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead>
        <tbody>${tableRows.join('')}</tbody>
      </table>
      <div class="footer">Generated by Trackit — Student Deadline Tracker</div>
    </body>
    </html>
  `;
}

export function exportTasksPDF(tasks) {
  const headers = ['Title', 'Status', 'Due Date', 'Course', 'Weight', 'Hours'];
  const rows = tasks.map(t => {
    const status = STATUS_CLASSES.includes(t.status) ? t.status : 'not_started';
    const statusLabel = status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    const description = t.description
      ? `${t.description.substring(0, 60)}${t.description.length > 60 ? '…' : ''}`
      : '';
    return `<tr>
      <td><strong>${escapeHTML(t.title)}</strong>${description ? `<br><span style="color:#94A3B8;font-size:10px">${escapeHTML(description)}</span>` : ''}</td>
      <td><span class="status status-${status}">${statusLabel}</span></td>
      <td>${formatDate(t.due_date) || '—'}</td>
      <td>${escapeHTML(t.course_code) || '—'}</td>
      <td>${t.grade_weight ? `${escapeHTML(t.grade_weight)}%` : '—'}</td>
      <td>${t.estimated_hours ? `${escapeHTML(t.estimated_hours)}h` : '—'}</td>
    </tr>`;
  });

  openPrintWindow(buildPrintHTML('My Tasks', headers, rows));
}

export function exportExamsPDF(exams) {
  const headers = ['Subject', 'Course Code', 'Exam Date', 'Confidence', 'Preparation', 'Topics'];
  const rows = exams.map(e => {
    const conf = ['low', 'medium', 'high'].includes(e.confidence_level) ? e.confidence_level : 'medium';
    const confClass = conf === 'high' ? 'status-done' : conf === 'low' ? 'status-stuck' : 'status-in_progress';
    return `<tr>
      <td><strong>${escapeHTML(e.subject)}</strong></td>
      <td>${escapeHTML(e.course_code) || '—'}</td>
      <td>${formatDate(e.exam_date) || '—'}</td>
      <td><span class="status ${confClass}">${conf.charAt(0).toUpperCase() + conf.slice(1)}</span></td>
      <td>${escapeHTML(e.preparation_percent ?? 0)}%</td>
      <td>${Array.isArray(e.topics) && e.topics.length ? escapeHTML(e.topics.join(', ')) : '—'}</td>
    </tr>`;
  });

  openPrintWindow(buildPrintHTML('My Exams', headers, rows));
}

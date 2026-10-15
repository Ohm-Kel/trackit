/**
 * In-memory fake of the Trackit API, installed as `fetch`. It implements the
 * routes the frontend calls with the same request and response shapes as the
 * Express API, rejects requests without the test token, and records every
 * call so tests can assert on what the app sent.
 */
let nextId = 1;
const id = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;

export function createFakeApi() {
  const db = {
    tasks: [],
    exams: [],
    subtasks: [],
    notifications: [],
    chat: [],
    profile: { display_name: 'Ama Owusu', email: 'ama@example.edu', weekly_schedule: null },
  };
  const calls = [];
  const overrides = new Map();

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const notFound = (what) => json({ error: `${what} not found` }, 404);

  function crud(table, label, body, method, itemId) {
    const rows = db[table];
    const index = rows.findIndex((row) => row.id === itemId);
    if (!itemId && method === 'GET') return json(rows);
    if (!itemId && method === 'POST') {
      const row = { id: id(), created_at: new Date().toISOString(), ...body };
      rows.push(row);
      return json(row, 201);
    }
    if (index === -1) return notFound(label);
    if (method === 'GET') return json(rows[index]);
    if (method === 'PATCH') {
      rows[index] = { ...rows[index], ...body };
      return json(rows[index]);
    }
    if (method === 'DELETE') {
      rows.splice(index, 1);
      return json({ success: true });
    }
    return json({ error: 'Method not allowed' }, 405);
  }

  async function handle(input, init = {}) {
    const url = new URL(String(input), 'http://localhost');
    const method = (init.method || 'GET').toUpperCase();
    const path = url.pathname.replace(/^\/api/, '');
    const headers = new Headers(init.headers);
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, query: url.search, body, headers });

    const override = overrides.get(`${method} ${path}`);
    if (override) return override({ body, url });

    if (headers.get('authorization') !== 'Bearer test-jwt') {
      return json({ error: 'Missing or invalid authorization header' }, 401);
    }

    const [, resource, itemId, action] = path.split('/');
    switch (resource) {
      case 'tasks':
        if (method === 'POST' && !body?.title?.trim()) return json({ error: 'title: Title is required' }, 400);
        return crud('tasks', 'Task', body, method, itemId);
      case 'exams':
        return crud('exams', 'Exam', body, method, itemId);
      case 'subtasks':
        if (method === 'GET') {
          const taskId = url.searchParams.get('task_id');
          const examId = url.searchParams.get('exam_id');
          return json(db.subtasks.filter((s) => (taskId ? s.task_id === taskId : s.exam_id === examId)));
        }
        return crud('subtasks', 'Subtask', body, method, itemId);
      case 'users':
        if (method === 'PATCH') Object.assign(db.profile, body);
        return json(db.profile);
      case 'notifications':
        if (itemId === 'generate-suggestions') return json({ message: 'No new suggestions needed at this time' });
        if (method === 'PATCH') {
          for (const n of db.notifications) {
            if (itemId === 'read-all' || (n.id === itemId && action === 'read')) n.read_status = true;
          }
          return json({ message: 'ok' });
        }
        return json(db.notifications);
      case 'analytics':
        // Same shape as backend/lib/analytics.js: four weeks, oldest first.
        return itemId === 'velocity'
          ? json([
              { name: 'Week of 24 Sept', tasks: 1 },
              { name: 'Week of 1 Oct', tasks: 0 },
              { name: 'Week of 8 Oct', tasks: 2 },
              { name: 'Week of 15 Oct', tasks: db.tasks.filter((t) => t.status === 'done').length },
            ])
          : json([]);
      case 'chat':
        if (method === 'DELETE') {
          db.chat.length = 0;
          return json({ success: true });
        }
        return json(db.chat);
      case 'upload':
        if (itemId === 'import-exams') {
          for (const exam of body.exams) db.exams.push({ id: id(), ...exam });
          return json({ imported: body.exams.length }, 201);
        }
        if (itemId === 'save-schedule') {
          db.profile.weekly_schedule = body.schedule;
          return json({ success: true });
        }
        return json({ error: 'Parse not stubbed in this test' }, 500);
      default:
        return json({ error: 'Not found' }, 404);
    }
  }

  return {
    db,
    calls,
    fetch: (input, init) => handle(input, init),
    /** Replace one route's response, e.g. on('POST /upload/parse', () => Response). */
    on: (route, responder) => overrides.set(route, responder),
    json,
    /** Calls matching "METHOD /path". */
    callsTo: (route) => calls.filter((c) => `${c.method} ${c.path}` === route),
  };
}

/** A task row in the shape the API returns. */
export function task(overrides = {}) {
  return {
    id: id(),
    title: 'Untitled',
    status: 'not_started',
    due_date: null,
    course_code: null,
    grade_weight: null,
    estimated_hours: null,
    description: null,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/** An exam row in the shape the API returns. */
export function exam(overrides = {}) {
  return {
    id: id(),
    subject: 'Untitled exam',
    course_code: null,
    exam_date: null,
    confidence_level: 'medium',
    preparation_percent: 0,
    topics: [],
    ...overrides,
  };
}

/** An ISO date `days` from today at noon, local time. */
export function inDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

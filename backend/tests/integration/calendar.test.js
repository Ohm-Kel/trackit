// Low failed-auth limit, so blocking after bad feed tokens is quick to test.
process.env.AUTH_FAILURE_LIMIT = '3';

const crypto = require('crypto');
const ICAL = require('ical.js');
const ctx = require('../helpers/app');
const { hasCall } = require('../helpers/supabaseMock');
const authFailures = require('../../lib/authFailures');
const logger = require('../../lib/logger');

beforeEach(() => {
  ctx.resetMocks();
  authFailures.reset();
});

const TOKEN = 'A'.repeat(43);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const scoped = (calls) => hasCall(calls, 'eq', 'user_id', ctx.USER.id);
const lastQuery = (table) => ctx.supabase.queries(table).at(-1);

const FEED = {
  tasks: [
    {
      id: '33333333-3333-4333-8333-333333333333',
      title: 'Essay, part 1; "draft" \\ final\nBEGIN:VEVENT',
      due_date: '2026-10-20T00:00:00+00:00',
      status: 'not_started',
      updated_at: '2026-10-01T00:00:00+00:00',
    },
  ],
  exams: [
    {
      id: '44444444-4444-4444-8444-444444444444',
      subject: 'Calculus II',
      exam_date: '2026-11-03T00:00:00+00:00',
      topics: [],
      updated_at: '2026-10-01T00:00:00+00:00',
    },
  ],
};

/** supertest buffers text/calendar as text only when asked to. */
const asText = (req) =>
  req.buffer(true).parse((res, done) => {
    let body = '';
    res.setEncoding('utf8');
    res.on('data', (chunk) => (body += chunk));
    res.on('end', () => done(null, body));
  });

function events(ics) {
  return new ICAL.Component(ICAL.parse(ics))
    .getAllSubcomponents('vevent')
    .map((e) => new ICAL.Event(e));
}

describe('calendar subscription link', () => {
  it('reports whether the user has a link', async () => {
    ctx.supabase.queue('calendar_feeds', { data: null });
    const none = await ctx.api().get('/api/calendar/feed').set(ctx.auth);
    expect(none.body).toEqual({ active: false, created_at: null });

    ctx.supabase.queue('calendar_feeds', { data: { created_at: '2026-10-15T10:00:00Z' } });
    const some = await ctx.api().get('/api/calendar/feed').set(ctx.auth);
    expect(some.body).toEqual({ active: true, created_at: '2026-10-15T10:00:00Z' });
    expect(scoped(lastQuery('calendar_feeds'))).toBe(true);
  });

  it('creates a high-entropy token, stores only its hash, and returns it once', async () => {
    ctx.supabase.queue('calendar_feeds', { data: { created_at: '2026-10-15T10:00:00Z' } });
    const res = await ctx.api().post('/api/calendar/feed').set(ctx.auth);

    expect(res.status).toBe(201);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(res.body.token, 'base64url')).toHaveLength(32);
    expect(res.body.path).toBe(`/calendar/${res.body.token}.ics`);

    const upsert = lastQuery('calendar_feeds').find(([method]) => method === 'upsert');
    const [, row, options] = upsert;
    expect(row).toEqual({
      user_id: ctx.USER.id,
      token_hash: sha256(res.body.token),
      created_at: expect.any(String),
    });
    expect(JSON.stringify(row)).not.toContain(res.body.token);
    expect(options).toEqual({ onConflict: 'user_id' });
  });

  it('issues a different token on every rotation', async () => {
    const tokens = new Set();
    for (let i = 0; i < 5; i += 1) {
      ctx.supabase.queue('calendar_feeds', { data: { created_at: 'now' } });
      tokens.add((await ctx.api().post('/api/calendar/feed').set(ctx.auth)).body.token);
    }
    expect(tokens.size).toBe(5);
  });

  it('revokes the link for the signed-in user only', async () => {
    const res = await ctx.api().delete('/api/calendar/feed').set(ctx.auth);
    expect(res.status).toBe(200);
    const calls = lastQuery('calendar_feeds');
    expect(hasCall(calls, 'delete')).toBe(true);
    expect(scoped(calls)).toBe(true);
  });

  it('requires sign-in to manage the link', async () => {
    expect((await ctx.api().get('/api/calendar/feed')).status).toBe(401);
    expect((await ctx.api().post('/api/calendar/feed')).status).toBe(401);
    expect((await ctx.api().delete('/api/calendar/feed')).status).toBe(401);
  });

  it('passes database errors to the error handler', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    ctx.supabase.queue('calendar_feeds', { error: { message: 'boom' } });
    expect((await ctx.api().post('/api/calendar/feed').set(ctx.auth)).status).toBe(500);
    ctx.supabase.queue('calendar_feeds', { error: { message: 'boom' } });
    expect((await ctx.api().get('/api/calendar/feed').set(ctx.auth)).status).toBe(500);
    ctx.supabase.queue('calendar_feeds', { error: { message: 'boom' } });
    expect((await ctx.api().delete('/api/calendar/feed').set(ctx.auth)).status).toBe(500);
    logger.error.mockRestore();
  });
});

describe('GET /api/calendar/:token.ics', () => {
  it('serves the feed as iCalendar without a session', async () => {
    ctx.supabase.rpc.mockResolvedValueOnce({ data: FEED, error: null });
    const res = await asText(ctx.api().get(`/api/calendar/${TOKEN}.ics`));

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');
    expect(res.headers['cache-control']).toBe('private, max-age=300');
    expect(res.headers['content-disposition']).toBe('inline; filename="trackit.ics"');
    expect(res.headers['x-robots-tag']).toBe('noindex, nofollow');
    expect(res.headers.etag).toBeDefined();
    expect(ctx.supabase.rpc).toHaveBeenCalledWith('calendar_feed', { p_token: TOKEN });
    // The feed runs as anon, never as a user or the service role.
    expect(ctx.createAnonClient).toHaveBeenCalled();
    expect(ctx.createUserClient).not.toHaveBeenCalled();

    const [task, exam] = events(res.body);
    expect(task.summary).toBe('Due: Essay, part 1; "draft" \\ final\nBEGIN:VEVENT');
    expect(task.uid).toBe(`trackit-task-${FEED.tasks[0].id}`);
    expect(task.startDate.toString()).toBe('2026-10-20');
    expect(exam.summary).toBe('Exam: Calculus II');
    expect(exam.startDate.toString()).toBe('2026-11-03');
    expect(res.body.split('\r\n').filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(2);
  });

  it('answers a refresh of an unchanged feed with 304 Not Modified', async () => {
    ctx.supabase.rpc.mockResolvedValue({ data: FEED, error: null });
    const first = await asText(ctx.api().get(`/api/calendar/${TOKEN}.ics`));
    const again = await ctx
      .api()
      .get(`/api/calendar/${TOKEN}.ics`)
      .set('If-None-Match', first.headers.etag);
    expect(again.status).toBe(304);
  });

  it('returns 404 for an unknown token and counts it as a failed authentication', async () => {
    ctx.supabase.rpc.mockResolvedValue({ data: null, error: null });
    for (let i = 0; i < 3; i += 1) {
      const res = await ctx.api().get(`/api/calendar/${TOKEN}.ics`);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Calendar not found' });
    }

    const blocked = await ctx.api().get(`/api/calendar/${TOKEN}.ics`);
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBeDefined();
    expect(ctx.supabase.rpc).toHaveBeenCalledTimes(3);
  });

  it('rejects a malformed token without querying the database', async () => {
    // Three tries: the limit in this file is 3.
    for (const bad of ['short', `${'A'.repeat(42)}.`, `${'A'.repeat(44)}`]) {
      const res = await ctx.api().get(`/api/calendar/${bad}.ics`);
      expect(res.status).toBe(404);
    }
    expect(ctx.supabase.rpc).not.toHaveBeenCalled();
    expect((await ctx.api().get(`/api/calendar/${TOKEN}.ics`)).status).toBe(429);
  });

  it('keeps the token out of the request log', async () => {
    const info = jest.spyOn(logger, 'info').mockImplementation(() => {});
    ctx.supabase.rpc.mockResolvedValueOnce({ data: FEED, error: null });
    await asText(ctx.api().get(`/api/calendar/${TOKEN}.ics`));
    const logged = JSON.stringify(info.mock.calls);
    expect(logged).toContain('/api/calendar/[token].ics');
    expect(logged).not.toContain(TOKEN);
    info.mockRestore();
  });

  it('returns 500 without detail when the lookup fails, and does not count it', async () => {
    const error = jest.spyOn(logger, 'error').mockImplementation(() => {});
    ctx.supabase.rpc.mockResolvedValue({ data: null, error: { message: 'db down' } });
    for (let i = 0; i < 3; i += 1) {
      expect((await ctx.api().get(`/api/calendar/${TOKEN}.ics`)).status).toBe(500);
    }
    expect(JSON.stringify(error.mock.calls)).not.toContain(TOKEN);

    // An outage is not the client's fault, so the IP is not blocked.
    ctx.supabase.rpc.mockResolvedValue({ data: FEED, error: null });
    expect((await ctx.api().get(`/api/calendar/${TOKEN}.ics`)).status).toBe(200);
    error.mockRestore();
  });
});

describe('GET /api/calendar/export.ics', () => {
  it('downloads open dated tasks and exams for the signed-in user', async () => {
    ctx.supabase.queue('tasks', { data: FEED.tasks });
    ctx.supabase.queue('exams', { data: FEED.exams });
    const res = await asText(ctx.api().get('/api/calendar/export.ics').set(ctx.auth));

    expect(res.status).toBe(200);
    expect(res.headers['content-disposition']).toBe('attachment; filename="trackit.ics"');
    expect(res.headers['cache-control']).toBe('no-store');
    expect(events(res.body)).toHaveLength(2);

    const tasks = lastQuery('tasks');
    expect(scoped(tasks)).toBe(true);
    expect(hasCall(tasks, 'neq', 'status', 'done')).toBe(true);
    expect(hasCall(tasks, 'not', 'due_date', 'is', null)).toBe(true);
    expect(scoped(lastQuery('exams'))).toBe(true);
  });

  it('downloads only tasks or only exams', async () => {
    ctx.supabase.queue('tasks', { data: FEED.tasks });
    const tasks = await asText(
      ctx.api().get('/api/calendar/export.ics?include=tasks').set(ctx.auth),
    );
    expect(tasks.headers['content-disposition']).toBe('attachment; filename="trackit-tasks.ics"');
    expect(events(tasks.body).map((e) => e.summary)).toEqual([`Due: ${FEED.tasks[0].title}`]);
    expect(ctx.supabase.queries('exams')).toHaveLength(0);

    ctx.supabase.queue('exams', { data: FEED.exams });
    const exams = await asText(
      ctx.api().get('/api/calendar/export.ics?include=exams').set(ctx.auth),
    );
    expect(events(exams.body).map((e) => e.summary)).toEqual(['Exam: Calculus II']);
    expect(ctx.supabase.queries('tasks')).toHaveLength(1);
  });

  it('validates the include parameter and requires sign-in', async () => {
    const bad = await ctx.api().get('/api/calendar/export.ics?include=notes').set(ctx.auth);
    expect(bad.status).toBe(400);
    expect((await ctx.api().get('/api/calendar/export.ics')).status).toBe(401);
  });

  it('passes database errors to the error handler', async () => {
    jest.spyOn(logger, 'error').mockImplementation(() => {});
    ctx.supabase.queue('tasks', { error: { message: 'boom' } });
    expect((await ctx.api().get('/api/calendar/export.ics').set(ctx.auth)).status).toBe(500);
    ctx.supabase.queue('exams', { error: { message: 'boom' } });
    const exams = await ctx.api().get('/api/calendar/export.ics?include=exams').set(ctx.auth);
    expect(exams.status).toBe(500);
    logger.error.mockRestore();
  });
});

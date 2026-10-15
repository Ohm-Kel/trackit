const ctx = require('../helpers/app');
const { hasCall } = require('../helpers/supabaseMock');

beforeEach(ctx.resetMocks);

const TASK_ID = '22222222-2222-4222-8222-222222222222';

describe('tasks API', () => {
  it('lists only the signed-in user’s tasks', async () => {
    ctx.supabase.queue('tasks', { data: [{ id: TASK_ID, title: 'Essay' }] });
    const res = await ctx.api().get('/api/tasks').set(ctx.auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const [calls] = ctx.supabase.queries('tasks');
    expect(hasCall(calls, 'eq', 'user_id', ctx.USER.id)).toBe(true);
  });

  it('creates a task owned by the user, ignoring a spoofed user_id', async () => {
    ctx.supabase.queue('tasks', { data: { id: TASK_ID, title: 'Essay' } });
    const res = await ctx
      .api()
      .post('/api/tasks')
      .set(ctx.auth)
      .send({ title: 'Essay', due_date: '', user_id: 'someone-else', grade_weight: 20 });

    expect(res.status).toBe(201);
    const [calls] = ctx.supabase.queries('tasks');
    const insertArgs = calls.find(([name]) => name === 'insert')[1][0];
    expect(insertArgs).toMatchObject({
      title: 'Essay',
      due_date: null,
      user_id: ctx.USER.id,
      status: 'not_started',
    });
  });

  it.each([
    [{}, 'title'],
    [{ title: 'x', grade_weight: 150 }, 'grade_weight'],
    [{ title: 'x', status: 'archived' }, 'status'],
    [{ title: 'x', due_date: 'next friday' }, 'due_date'],
  ])('rejects invalid payload %j', async (body, field) => {
    const res = await ctx.api().post('/api/tasks').set(ctx.auth).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(field);
    expect(ctx.supabase.queries('tasks')).toHaveLength(0);
  });

  it('returns 404 when updating a task the user does not own', async () => {
    ctx.supabase.queue('tasks', { data: [] });
    const res = await ctx
      .api()
      .patch(`/api/tasks/${TASK_ID}`)
      .set(ctx.auth)
      .send({ status: 'done' });

    expect(res.status).toBe(404);
    const [calls] = ctx.supabase.queries('tasks');
    expect(hasCall(calls, 'eq', 'user_id', ctx.USER.id)).toBe(true);
  });

  it('rejects an empty update', async () => {
    const res = await ctx.api().patch(`/api/tasks/${TASK_ID}`).set(ctx.auth).send({});
    expect(res.status).toBe(400);
  });

  it('maps a missing row to 404 on fetch', async () => {
    ctx.supabase.queue('tasks', { error: { code: 'PGRST116' } });
    const res = await ctx.api().get(`/api/tasks/${TASK_ID}`).set(ctx.auth);
    expect(res.status).toBe(404);
  });

  it('deletes a task scoped to the user', async () => {
    ctx.supabase.queue('tasks', { data: [{ id: TASK_ID }] });
    const res = await ctx.api().delete(`/api/tasks/${TASK_ID}`).set(ctx.auth);
    expect(res.status).toBe(200);
    expect(hasCall(ctx.supabase.queries('tasks')[0], 'eq', 'user_id', ctx.USER.id)).toBe(true);
  });
});

describe('subtasks API', () => {
  it('refuses to attach a subtask to another user’s task', async () => {
    ctx.supabase.queue('tasks', { data: null });
    const res = await ctx
      .api()
      .post('/api/subtasks')
      .set(ctx.auth)
      .send({ task_id: TASK_ID, title: 'Outline' });

    expect(res.status).toBe(404);
    expect(ctx.supabase.queries('subtasks')).toHaveLength(0);
  });

  it('creates a subtask when the parent task is owned', async () => {
    ctx.supabase.queue('tasks', { data: { id: TASK_ID } });
    ctx.supabase.queue('subtasks', { data: { id: 's1', title: 'Outline' } });
    const res = await ctx
      .api()
      .post('/api/subtasks')
      .set(ctx.auth)
      .send({ task_id: TASK_ID, title: 'Outline' });

    expect(res.status).toBe(201);
    const insert = ctx.supabase.queries('subtasks')[0].find(([name]) => name === 'insert')[1];
    expect(insert.user_id).toBe(ctx.USER.id);
  });

  it('requires exactly one parent', async () => {
    const res = await ctx
      .api()
      .post('/api/subtasks')
      .set(ctx.auth)
      .send({ task_id: TASK_ID, exam_id: TASK_ID, title: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('exams and profile APIs', () => {
  it('creates an exam with defaults', async () => {
    ctx.supabase.queue('exams', { data: { id: 'e1' } });
    const res = await ctx.api().post('/api/exams').set(ctx.auth).send({ subject: 'Calculus' });
    expect(res.status).toBe(201);
    const insert = ctx.supabase.queries('exams')[0].find(([n]) => n === 'insert')[1][0];
    expect(insert).toMatchObject({ confidence_level: 'medium', topics: [], user_id: ctx.USER.id });
  });

  it('creates a missing profile row on first fetch', async () => {
    ctx.supabase.queue('users', { data: null });
    ctx.supabase.queue('users', { data: { id: ctx.USER.id, display_name: 'student' } });
    const res = await ctx.api().get('/api/users/profile').set(ctx.auth);
    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe('student');
  });

  it('only updates allowed profile fields', async () => {
    ctx.supabase.queue('users', { data: { id: ctx.USER.id } });
    await ctx
      .api()
      .patch('/api/users/profile')
      .set(ctx.auth)
      .send({ university: 'Junia', is_admin: true });
    const upsert = ctx.supabase.queries('users')[0].find(([n]) => n === 'upsert')[1];
    expect(upsert).toEqual({ university: 'Junia', id: ctx.USER.id, email: ctx.USER.email });
  });
});

const ctx = require('../helpers/app');
const { hasCall } = require('../helpers/supabaseMock');

beforeEach(ctx.resetMocks);

const ID = '33333333-3333-4333-8333-333333333333';
const scoped = (table, index = 0) =>
  hasCall(ctx.supabase.queries(table)[index], 'eq', 'user_id', ctx.USER.id);

describe('exams API', () => {
  it('lists, fetches, updates and deletes within the user scope', async () => {
    ctx.supabase.queue('exams', { data: [{ id: ID }] });
    expect((await ctx.api().get('/api/exams').set(ctx.auth)).status).toBe(200);

    ctx.supabase.queue('exams', { data: { id: ID } });
    expect((await ctx.api().get(`/api/exams/${ID}`).set(ctx.auth)).status).toBe(200);

    ctx.supabase.queue('exams', { data: [{ id: ID, confidence_level: 'high' }] });
    const updated = await ctx
      .api()
      .patch(`/api/exams/${ID}`)
      .set(ctx.auth)
      .send({ confidence_level: 'high' });
    expect(updated.body.confidence_level).toBe('high');

    ctx.supabase.queue('exams', { data: [] });
    expect((await ctx.api().delete(`/api/exams/${ID}`).set(ctx.auth)).status).toBe(404);

    for (let i = 0; i < 4; i += 1) expect(scoped('exams', i)).toBe(true);
  });

  it('rejects an invalid confidence level', async () => {
    const res = await ctx
      .api()
      .post('/api/exams')
      .set(ctx.auth)
      .send({ subject: 'x', confidence_level: 'meh' });
    expect(res.status).toBe(400);
  });
});

describe('notifications API', () => {
  it('lists and marks notifications as read for the user only', async () => {
    ctx.supabase.queue('notifications', { data: [{ id: ID }] });
    expect((await ctx.api().get('/api/notifications').set(ctx.auth)).body).toHaveLength(1);

    ctx.supabase.queue('notifications', { data: [{ id: ID }] });
    expect((await ctx.api().patch(`/api/notifications/${ID}/read`).set(ctx.auth)).status).toBe(200);

    ctx.supabase.queue('notifications', { data: [] });
    expect((await ctx.api().patch(`/api/notifications/${ID}/read`).set(ctx.auth)).status).toBe(404);

    expect((await ctx.api().patch('/api/notifications/read-all').set(ctx.auth)).status).toBe(200);
    for (let i = 0; i < 4; i += 1) expect(scoped('notifications', i)).toBe(true);
  });

  it('generates a suggestion once and skips duplicates', async () => {
    const soon = new Date(Date.now() + 86400000).toISOString();
    ctx.supabase.queue('tasks', { data: [{ title: 'Essay', due_date: soon }] });
    ctx.supabase.queue('notifications', { data: [] });
    ctx.supabase.queue('notifications', { data: null });
    const first = await ctx.api().post('/api/notifications/generate-suggestions').set(ctx.auth);
    expect(first.body.message).toBe('Suggestion generated');

    ctx.supabase.queue('tasks', { data: [{ title: 'Essay', due_date: soon }] });
    ctx.supabase.queue('notifications', { data: [{ id: ID }] });
    const second = await ctx.api().post('/api/notifications/generate-suggestions').set(ctx.auth);
    expect(second.body.message).toMatch(/No new suggestions/);
  });

  it('returns no suggestion when nothing is due', async () => {
    ctx.supabase.queue('tasks', { data: [] });
    const res = await ctx.api().post('/api/notifications/generate-suggestions').set(ctx.auth);
    expect(res.body.message).toMatch(/No new suggestions/);
  });
});

describe('analytics API', () => {
  it('returns velocity and burnout reports for the user', async () => {
    ctx.supabase.queue('tasks', { data: [{ completed_at: new Date().toISOString() }] });
    const velocity = await ctx.api().get('/api/analytics/velocity').set(ctx.auth);
    expect(velocity.body).toHaveLength(4);
    expect(velocity.body[3].tasks).toBe(1);

    ctx.supabase.queue('tasks', { data: [] });
    const burnout = await ctx.api().get('/api/analytics/burnout').set(ctx.auth);
    expect(burnout.body).toEqual([]);

    expect(scoped('tasks', 0)).toBe(true);
    expect(scoped('tasks', 1)).toBe(true);
  });
});

describe('chat history API', () => {
  it('returns the latest messages oldest-first', async () => {
    ctx.supabase.queue('chat_history', {
      data: [
        { role: 'assistant', content: 'newest' },
        { role: 'user', content: 'older' },
      ],
    });
    const res = await ctx.api().get('/api/chat/history').set(ctx.auth);
    expect(res.body.map((m) => m.content)).toEqual(['older', 'newest']);
    expect(hasCall(ctx.supabase.queries('chat_history')[0], 'order', 'created_at')).toBe(true);
  });

  it('clears only the user’s history', async () => {
    expect((await ctx.api().delete('/api/chat/history').set(ctx.auth)).status).toBe(200);
    expect(scoped('chat_history')).toBe(true);
  });

  it('still replies when persisting history fails', async () => {
    ctx.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
    ctx.supabase.queue('chat_history', { error: { message: 'write failed' } });
    const res = await ctx.api().post('/api/chat').set(ctx.auth).send({ message: 'q' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('ok');
  });
});

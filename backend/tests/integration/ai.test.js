process.env.CHAT_MAX_HISTORY_MESSAGES = '4';
const ctx = require('../helpers/app');
const { TOOLS } = require('../../lib/timetableParser');

beforeEach(ctx.resetMocks);

function chatReply(text) {
  ctx.anthropic.messages.create.mockResolvedValue({
    content: [{ type: 'text', text }],
    usage: { input_tokens: 500, output_tokens: 40 },
  });
}

describe('POST /api/chat', () => {
  it('grounds the model in the user’s data and persists both turns', async () => {
    ctx.supabase.queue('tasks', {
      data: [{ title: 'Essay', status: 'not_started', due_date: '2026-12-01' }],
    });
    ctx.supabase.queue('exams', { data: [] });
    chatReply('Start the essay today.');

    const res = await ctx
      .api()
      .post('/api/chat')
      .set(ctx.auth)
      .send({
        message: 'What first?',
        history: [
          { role: 'user', content: 'hi' },
          { role: 'assistant', content: 'hello' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ reply: 'Start the essay today.' });

    const request = ctx.anthropic.messages.create.mock.calls[0][0];
    expect(request.system).toContain('"Essay"');
    expect(request.messages).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'What first?' },
    ]);

    const insert = ctx.supabase.queries('chat_history')[0].find(([n]) => n === 'insert')[1];
    expect(insert.map((row) => row.role)).toEqual(['user', 'assistant']);
  });

  it('caps the history sent to the model', async () => {
    chatReply('ok');
    const history = Array.from({ length: 12 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `turn ${i}`,
    }));
    await ctx.api().post('/api/chat').set(ctx.auth).send({ message: 'q', history });

    const { messages } = ctx.anthropic.messages.create.mock.calls[0][0];
    expect(messages.length).toBeLessThanOrEqual(5);
  });

  it.each([
    [{}, 'message'],
    [{ message: '   ' }, 'message'],
    [{ message: 'q', history: [{ role: 'ai', text: 'legacy shape' }] }, 'history'],
  ])('rejects invalid body %j without calling the model', async (body, field) => {
    const res = await ctx.api().post('/api/chat').set(ctx.auth).send(body);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(field);
    expect(ctx.anthropic.messages.create).not.toHaveBeenCalled();
  });

  it('maps upstream failures to a safe 503', async () => {
    ctx.anthropic.messages.create.mockRejectedValue({ status: 429, message: 'org quota detail' });
    const res = await ctx.api().post('/api/chat').set(ctx.auth).send({ message: 'q' });
    expect(res.status).toBe(503);
    expect(res.body.error).not.toContain('quota');
  });
});

describe('POST /api/upload/parse', () => {
  const body = { file: 'JVBERi0xLjQK', mimeType: 'application/pdf', type: 'exam' };

  it('returns validated exams and reports skipped rows', async () => {
    ctx.anthropic.messages.create.mockResolvedValue({
      content: [
        {
          type: 'tool_use',
          name: TOOLS.exam.name,
          input: {
            exams: [
              {
                subject: 'Calculus',
                course_code: 'MATH 201',
                exam_date: '2026-12-10',
                exam_time: '09:00',
                venue: 'Hall A',
              },
              {
                subject: 'Broken',
                course_code: null,
                exam_date: 'tenth of december',
                exam_time: null,
                venue: null,
              },
            ],
          },
        },
      ],
    });

    const res = await ctx.api().post('/api/upload/parse').set(ctx.auth).send(body);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.warnings).toEqual(['1 entry was unreadable and skipped.']);
    expect(res.body).not.toHaveProperty('raw');
  });

  it.each([
    [{ ...body, mimeType: 'text/html' }, 'mimeType'],
    [{ ...body, file: 'data:application/pdf;base64,AAAA' }, 'file'],
    [{ ...body, type: 'invoice' }, 'type'],
  ])('rejects invalid upload %#', async (payload, field) => {
    const res = await ctx.api().post('/api/upload/parse').set(ctx.auth).send(payload);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain(field);
    expect(ctx.anthropic.messages.create).not.toHaveBeenCalled();
  });

  it('imports edited exams for the user only', async () => {
    ctx.supabase.queue('exams', { data: [{ id: 'e1' }] });
    const res = await ctx
      .api()
      .post('/api/upload/import-exams')
      .set(ctx.auth)
      .send({ exams: [{ subject: 'Calculus', exam_date: '', user_id: 'someone-else' }] });

    expect(res.status).toBe(201);
    const rows = ctx.supabase.queries('exams')[0].find(([n]) => n === 'insert')[1];
    expect(rows[0]).toMatchObject({ user_id: ctx.USER.id, exam_date: null });
  });

  it('rejects a schedule with malformed times', async () => {
    const schedule = Object.fromEntries(
      ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [
        d,
        [],
      ]),
    );
    schedule.monday = [{ start: '8am', end: '10:00', subject: 'Maths', venue: null }];
    const res = await ctx.api().post('/api/upload/save-schedule').set(ctx.auth).send({ schedule });
    expect(res.status).toBe(400);
  });
});

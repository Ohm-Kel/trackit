const db = require('./helpers');

let user;

beforeAll(async () => {
  user = await db.createUser('chatter');
  const app = db.api();
  await app
    .post('/api/tasks')
    .set(user.auth)
    .send({ title: 'Thermodynamics problem set', due_date: '2026-11-02', grade_weight: 15 });
  await app
    .post('/api/exams')
    .set(user.auth)
    .send({ subject: 'Organic chemistry', exam_date: '2026-12-05', topics: ['Alkenes'] });
});
afterAll(db.deleteUsers);
beforeEach(() => db.anthropic.messages.create.mockReset());

describe('chat against the real database', () => {
  it('grounds the reply in the user’s tasks and exams and saves both turns', async () => {
    db.anthropic.messages.create.mockResolvedValue({
      content: [{ type: 'text', text: 'Start the problem set.' }],
      usage: { input_tokens: 10, output_tokens: 5 },
    });

    const res = await db.api().post('/api/chat').set(user.auth).send({ message: 'What first?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Start the problem set.');

    const { system } = db.anthropic.messages.create.mock.calls[0][0];
    expect(system).toContain('"Thermodynamics problem set"');
    expect(system).toContain('weight: 15%');
    expect(system).toContain('"Organic chemistry"');
    expect(system).toContain('topics: Alkenes');

    const stored = await db.rows('chat_history', { user_id: user.id });
    expect(stored.map(({ role, content }) => ({ role, content }))).toEqual(
      expect.arrayContaining([
        { role: 'user', content: 'What first?' },
        { role: 'assistant', content: 'Start the problem set.' },
      ]),
    );
  });

  it('saves a streamed reply', async () => {
    const events = [
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Streamed ' } },
      { type: 'content_block_delta', delta: { type: 'text_delta', text: 'answer' } },
    ];
    db.anthropic.messages.stream.mockReturnValue({
      abort: jest.fn(),
      finalMessage: async () => ({ usage: { input_tokens: 1, output_tokens: 2 } }),
      async *[Symbol.asyncIterator]() {
        yield* events;
      },
    });

    const res = await db.api().post('/api/chat/stream').set(user.auth).send({ message: 'Stream?' });
    expect(res.status).toBe(200);
    expect(res.text).toContain('event: done');

    const stored = await db.rows('chat_history', { user_id: user.id });
    expect(stored.map((turn) => turn.content)).toEqual(
      expect.arrayContaining(['Stream?', 'Streamed answer']),
    );
  });

  it('returns history oldest first and clears it', async () => {
    const app = db.api();
    const history = await app.get('/api/chat/history').set(user.auth);
    expect(history.status).toBe(200);
    expect(history.body.length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(history.body[0]).sort()).toEqual(['content', 'created_at', 'role']);
    const times = history.body.map((turn) => new Date(turn.created_at).getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));

    await app.delete('/api/chat/history').set(user.auth).expect(200);
    expect((await app.get('/api/chat/history').set(user.auth)).body).toEqual([]);
  });
});

// The shared store is what production uses; tests default to memory.
process.env.RATE_LIMIT_STORE = 'supabase';
process.env.AI_CHAT_RATE_LIMIT = '2';
const db = require('./helpers');

afterAll(db.deleteUsers);

beforeEach(() => {
  db.anthropic.messages.create.mockReset();
  db.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
});

describe('shared rate-limit store against the real database', () => {
  it('counts one user’s requests across two app instances', async () => {
    const user = await db.createUser('limited');
    const first = db.isolatedApi();
    const second = db.isolatedApi();
    const ask = (app) => app.post('/api/chat').set(user.auth).send({ message: 'q' });

    // Per-instance memory counters would allow all three.
    expect((await ask(first)).status).toBe(200);
    expect((await ask(second)).status).toBe(200);
    const blocked = await ask(first);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/limit reached/);
    expect(db.anthropic.messages.create).toHaveBeenCalledTimes(2);

    const [counter] = await db.rows('rate_limits', { key: `chat:${user.id}` });
    expect(counter.hits).toBe(3);
    expect(new Date(counter.reset_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('keeps separate counters per user and per limiter', async () => {
    const other = await db.createUser('unlimited');
    const res = await db.isolatedApi().post('/api/chat').set(other.auth).send({ message: 'q' });
    expect(res.status).toBe(200);
    expect(res.headers['ratelimit']).toMatch(/r=1/);
    expect(await db.rows('rate_limits', { key: `upload:${other.id}` })).toEqual([]);
  });

  it('does not let a signed-in user read or bump counters directly', async () => {
    const user = await db.createUser('sneaky');
    const { createUserClient } = require('../../supabaseUserClient');
    const asUser = createUserClient(user.token);

    const rpc = await asUser.rpc('rate_limit_hit', { p_key: `chat:${user.id}`, p_window_ms: 1000 });
    expect(rpc.error).not.toBeNull();
    const read = await asUser.from('rate_limits').select('*');
    expect(read.error).not.toBeNull();
  });
});

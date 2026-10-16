// Exercise the limiter wired to the shared Postgres store, with the database
// counter simulated by the Supabase fake.
process.env.RATE_LIMIT_STORE = 'supabase';
process.env.AI_CHAT_RATE_LIMIT = '2';
const ctx = require('../helpers/app');

beforeEach(ctx.resetMocks);

it('enforces the chat limit using counts from the shared store', async () => {
  const counts = new Map();
  ctx.supabase.rpc.mockImplementation(async (fn, { p_key: key }) => {
    counts.set(key, (counts.get(key) ?? 0) + 1);
    return { data: [{ total_hits: counts.get(key), resets_at: new Date().toISOString() }] };
  });
  ctx.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
  const app = ctx.api();

  const statuses = [];
  for (let i = 0; i < 3; i += 1) {
    statuses.push((await app.post('/api/chat').set(ctx.auth).send({ message: 'q' })).status);
  }

  expect(statuses).toEqual([200, 200, 429]);
  expect([...counts.keys()]).toEqual([`chat:${ctx.USER.id}`]);
  expect(ctx.anthropic.messages.create).toHaveBeenCalledTimes(2);
});

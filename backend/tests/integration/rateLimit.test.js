// Jest gives each test file its own module registry, so the module-level
// limiter here starts from zero.
process.env.AI_CHAT_RATE_LIMIT = '3';
const ctx = require('../helpers/app');

beforeEach(ctx.resetMocks);

it('rate-limits each user after the configured number of chat requests', async () => {
  ctx.anthropic.messages.create.mockResolvedValue({ content: [{ type: 'text', text: 'ok' }] });
  const app = ctx.api();

  const statuses = [];
  for (let i = 0; i < 4; i += 1) {
    statuses.push(
      (
        await app
          .post('/api/chat')
          .set(ctx.auth)
          .send({ message: `q${i}` })
      ).status,
    );
  }

  expect(statuses).toEqual([200, 200, 200, 429]);
  const limited = await app.post('/api/chat').set(ctx.auth).send({ message: 'again' });
  expect(limited.body.error).toMatch(/limit/i);
  expect(limited.headers).toHaveProperty('ratelimit-policy');
  expect(ctx.anthropic.messages.create).toHaveBeenCalledTimes(3);
});

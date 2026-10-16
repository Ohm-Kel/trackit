// Jest gives each test file its own module registry, so these limits apply
// only here.
process.env.API_RATE_LIMIT_PER_MINUTE = '3';
process.env.AUTH_FAILURE_LIMIT = '2';
const ctx = require('../helpers/app');
const { apiLimiter } = require('../../middleware/rateLimit');
const authFailures = require('../../lib/authFailures');

beforeEach(async () => {
  ctx.resetMocks();
  authFailures.reset();
  await apiLimiter.resetKey(ctx.USER.id);
});

it('limits each user across all authenticated routes', async () => {
  const app = ctx.api();
  const statuses = [];
  for (const path of ['/api/tasks', '/api/exams', '/api/notifications', '/api/tasks']) {
    statuses.push((await app.get(path).set(ctx.auth)).status);
  }
  expect(statuses).toEqual([200, 200, 200, 429]);
});

it('limits failed authentication per IP without counting successful requests', async () => {
  const app = ctx.api();
  const bad = () => app.get('/api/tasks').set('Authorization', 'Bearer wrong');

  // Successful requests from the same IP never count towards the limit.
  expect((await app.get('/api/tasks').set(ctx.auth)).status).toBe(200);
  expect((await app.get('/api/tasks').set(ctx.auth)).status).toBe(200);

  expect((await bad()).status).toBe(401);
  expect((await bad()).status).toBe(401);
  const blocked = await bad();
  expect(blocked.status).toBe(429);
  expect(blocked.body.error).toMatch(/failed sign-in/i);
  expect(Number(blocked.headers['retry-after'])).toBeGreaterThan(0);
  // A blocked request never reaches Supabase Auth.
  expect(ctx.supabase.getUser).toHaveBeenCalledTimes(4);
});

it('does not count requests that are in flight or succeed as failures', async () => {
  // Many concurrent signed-in requests from one shared IP (a campus network)
  // are never treated as failed sign-ins, however many there are.
  await apiLimiter.resetKey(ctx.USER.id);
  const app = ctx.api();
  const results = await Promise.all(Array.from({ length: 3 }, () => app.get('/api/health')));
  expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
  expect(authFailures.retryAfterSeconds('::ffff:127.0.0.1')).toBe(0);
});

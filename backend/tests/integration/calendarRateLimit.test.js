// Low limits, so both are quick to reach.
process.env.CALENDAR_FEED_RATE_LIMIT = '3';
process.env.AUTH_FAILURE_LIMIT = '2';

const ctx = require('../helpers/app');

beforeEach(ctx.resetMocks);

const TOKEN = 'C'.repeat(43);

it('limits feed requests per IP without blocking the rest of the API', async () => {
  ctx.supabase.rpc.mockResolvedValue({ data: { tasks: [], exams: [] }, error: null });
  for (let i = 0; i < 3; i += 1) {
    expect((await ctx.api().get(`/api/calendar/${TOKEN}.ics`)).status).toBe(200);
  }

  const limited = await ctx.api().get(`/api/calendar/${TOKEN}.ics`);
  expect(limited.status).toBe(429);
  expect(limited.body).toEqual({ error: 'Too many calendar requests. Please try again later.' });
  expect(ctx.supabase.rpc).toHaveBeenCalledTimes(3);

  // The feed limit is separate from the failed-auth counter.
  ctx.supabase.queue('calendar_feeds', { data: null });
  expect((await ctx.api().get('/api/calendar/feed').set(ctx.auth)).status).toBe(200);
});

process.env.ALLOWED_ORIGINS = 'http://localhost:5173';
const ctx = require('../helpers/app');

beforeEach(ctx.resetMocks);

describe('platform behaviour', () => {
  it('serves the health check with and without the /api prefix', async () => {
    for (const path of ['/api/health', '/health']) {
      const res = await ctx.api().get(path);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    }
  });

  it('no longer exposes the debug-env endpoint', async () => {
    expect((await ctx.api().get('/api/debug-env')).status).toBe(404);
  });

  it('sends security headers and hides the framework', async () => {
    const res = await ctx.api().get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('allows CORS only for allowlisted origins', async () => {
    const allowed = await ctx.api().get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blocked = await ctx.api().get('/api/health').set('Origin', 'https://evil.example');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('returns 400 for malformed JSON without leaking parser details', async () => {
    const res = await ctx
      .api()
      .post('/api/tasks')
      .set(ctx.auth)
      .set('Content-Type', 'application/json')
      .send('{"title":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Request body must be valid JSON' });
  });

  it('hides database error details behind a generic 500', async () => {
    ctx.supabase.queue('tasks', {
      error: { message: 'relation "tasks" does not exist', code: '42P01' },
    });
    const res = await ctx.api().get('/api/tasks').set(ctx.auth);
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal server error' });
  });
});

describe('authentication', () => {
  it('rejects requests without a bearer token', async () => {
    const res = await ctx.api().get('/api/tasks');
    expect(res.status).toBe(401);
    expect(ctx.supabase.getUser).not.toHaveBeenCalled();
  });

  it('rejects invalid tokens without echoing the reason', async () => {
    const res = await ctx.api().get('/api/tasks').set('Authorization', 'Bearer wrong');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Invalid or expired token' });
    expect(ctx.createUserClient).not.toHaveBeenCalled();
  });

  it('queries as the signed-in user so Row Level Security applies', async () => {
    const res = await ctx.api().get('/api/tasks').set(ctx.auth);
    expect(res.status).toBe(200);
    expect(ctx.createUserClient).toHaveBeenCalledTimes(1);
    expect(ctx.createUserClient).toHaveBeenCalledWith(ctx.TOKEN);
  });
});

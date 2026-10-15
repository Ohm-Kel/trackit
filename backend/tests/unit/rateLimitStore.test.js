const { SupabaseRateLimitStore } = require('../../lib/rateLimitStore');

const WINDOW_MS = 60_000;

function makeStore(rpc) {
  const deletes = [];
  const client = {
    rpc: jest.fn(rpc),
    from: jest.fn(() => ({
      delete: () => ({ eq: async (column, value) => deletes.push([column, value]) }),
    })),
  };
  const store = new SupabaseRateLimitStore({ client, prefix: 'chat:' });
  store.init({ windowMs: WINDOW_MS });
  return { store, client, deletes };
}

afterEach(() => jest.restoreAllMocks());

it('counts hits in Postgres under a per-limiter key', async () => {
  const resetsAt = '2026-10-15T21:00:00.000Z';
  const { store, client } = makeStore(async () => ({
    data: [{ total_hits: 4, resets_at: resetsAt }],
    error: null,
  }));

  await expect(store.increment('user-1')).resolves.toEqual({
    totalHits: 4,
    resetTime: new Date(resetsAt),
  });
  expect(client.rpc).toHaveBeenCalledWith('rate_limit_hit', {
    p_key: 'chat:user-1',
    p_window_ms: WINDOW_MS,
  });
  expect(store.localKeys).toBe(false);
  store.shutdown();
});

it('falls back to counting in memory when the database call fails', async () => {
  const logger = require('../../lib/logger');
  const logError = jest.spyOn(logger, 'error');
  let healthy = false;
  const { store } = makeStore(async () =>
    healthy
      ? { data: [{ total_hits: 1, resets_at: new Date().toISOString() }], error: null }
      : { data: null, error: { message: 'function rate_limit_hit does not exist' } },
  );

  expect((await store.increment('user-1')).totalHits).toBe(1);
  expect((await store.increment('user-1')).totalHits).toBe(2);
  // One log per outage, not per request.
  expect(logError).toHaveBeenCalledTimes(1);

  healthy = true;
  expect((await store.increment('user-1')).totalHits).toBe(1);
  expect(store.degraded).toBe(false);
  store.shutdown();
});

it('decrements and resets the shared counter', async () => {
  const { store, client, deletes } = makeStore(async () => ({ data: null, error: null }));

  await store.decrement('user-1');
  expect(client.rpc).toHaveBeenCalledWith('rate_limit_decrement', { p_key: 'chat:user-1' });

  await store.resetKey('user-1');
  expect(client.from).toHaveBeenCalledWith('rate_limits');
  expect(deletes).toEqual([['key', 'chat:user-1']]);
  store.shutdown();
});

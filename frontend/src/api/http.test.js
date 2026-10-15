import { afterEach, describe, expect, it, vi } from 'vitest';
import { onlineManager } from '@tanstack/react-query';
import { supabase, signInAs, resetSupabase } from '../test/fakeSupabase';

vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));

const { apiJson } = await import('./http');

afterEach(() => resetSupabase());

describe('apiJson', () => {
  it('sends JSON with the user’s token to the API base', async () => {
    signInAs();
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true })));
    await expect(apiJson('/tasks', { method: 'POST', body: { title: 'x' } })).resolves.toEqual({ ok: true });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/tasks');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer test-jwt', 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"title":"x"}');
  });

  it('sends no Authorization header when signed out', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([])));
    await apiJson('/health');
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty('Authorization');
    expect(supabase.auth.getSession).toHaveBeenCalled();
  });

  it('throws the API’s message, status and request ID', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'Internal server error', requestId: 'req-1' }, { status: 500 })));
    await expect(apiJson('/tasks')).rejects.toMatchObject({
      message: 'Internal server error',
      status: 500,
      requestId: 'req-1',
    });
  });

  it('explains a non-JSON error response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Not found</html>', { status: 404 })));
    const error = await apiJson('/users/profile', { fallbackError: 'Failed to load profile' }).catch((e) => e);
    expect(error.message).toBe('Failed to load profile (404)');
    expect(error.details).toMatch(/non-JSON/);
  });
});

describe('apiRequest offline', () => {
  afterEach(() => onlineManager.setOnline(true));

  it('refuses writes while offline without calling the API', async () => {
    signInAs();
    vi.stubGlobal('fetch', vi.fn());
    onlineManager.setOnline(false);
    await expect(apiJson('/tasks', { method: 'POST', body: { title: 'x' } })).rejects.toMatchObject({
      message: expect.stringMatching(/offline/),
      offline: true,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('still lets reads through, for the browser to answer or fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json([])));
    onlineManager.setOnline(false);
    await expect(apiJson('/tasks')).resolves.toEqual([]);
  });
});

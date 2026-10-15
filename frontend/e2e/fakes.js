import { test as base, expect } from '@playwright/test';
import { createFakeApi, exam, inDays, task } from '../src/test/fakeApi.js';
import { SUPABASE_URL } from '../playwright.config.js';

export { expect, exam, inDays, task };

export const USER = {
  id: '11111111-1111-4111-8111-111111111111',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'ama@example.edu',
  app_metadata: { provider: 'email' },
  user_metadata: { full_name: 'Ama Owusu' },
  created_at: '2026-09-01T00:00:00Z',
};

function session() {
  const now = Math.floor(Date.now() / 1000);
  return {
    access_token: 'test-jwt',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: now + 3600,
    refresh_token: 'refresh-token',
    user: USER,
  };
}

/**
 * Fixtures: `api` is the in-memory fake Trackit API (the same one the unit
 * tests use) answering every /api request; Supabase Auth and REST calls are
 * answered by a minimal GoTrue/PostgREST stand-in. `signIn()` stores a session
 * the way supabase-js does, so pages load signed in.
 */
export const test = base.extend({
  // Every test fails on a Content-Security-Policy violation unless it empties
  // this list itself.
  cspViolations: [
    async ({ page }, use) => {
      const violations = [];
      page.on('console', (msg) => {
        if (/Content Security Policy/i.test(msg.text())) violations.push(msg.text());
      });
      await use(violations);
      expect(violations, 'Content-Security-Policy violations').toEqual([]);
    },
    { auto: true },
  ],

  api: async ({ page }, use) => {
    const api = createFakeApi();

    await page.route('**/api/**', async (route) => {
      const req = route.request();
      const res = await api.fetch(req.url(), {
        method: req.method(),
        headers: req.headers(),
        body: req.postData() ?? undefined,
      });
      await route.fulfill({
        status: res.status,
        headers: Object.fromEntries(res.headers),
        body: Buffer.from(await res.arrayBuffer()),
      });
    });

    await page.route(`${SUPABASE_URL}/**`, async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/auth/v1/token') {
        const { password } = route.request().postDataJSON();
        return password === 'correct-horse'
          ? route.fulfill({ json: session() })
          : route.fulfill({
              status: 400,
              json: { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials' },
            });
      }
      if (url.pathname === '/auth/v1/user') return route.fulfill({ json: USER });
      if (url.pathname === '/auth/v1/logout') return route.fulfill({ status: 204, body: '' });
      if (url.pathname.startsWith('/rest/v1/')) return route.fulfill({ status: 201, json: [] });
      return route.fulfill({ status: 404, json: {} });
    });

    await use(api);
  },

  signIn: async ({ page }, use) => {
    await use(async () => {
      // supabase-js keeps the session in localStorage under sb-<ref>-auth-token;
      // for a local URL the ref is the hostname's first label.
      await page.addInitScript((value) => {
        localStorage.setItem('sb-127-auth-token', value);
        localStorage.setItem('trackit_onboarding_done', 'true');
      }, JSON.stringify(session()));
    });
  },
});

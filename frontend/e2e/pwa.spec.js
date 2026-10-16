import AxeBuilder from '@axe-core/playwright';
import { expect, inDays, task, test } from './fakes.js';
import { SUPABASE_URL } from '../playwright.config.js';

const seed = (api) =>
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(2), grade_weight: 30 }),
    task({ title: 'Lab report', status: 'not_started', due_date: inDays(4) }),
  );

/** Wait until the task list has been saved to IndexedDB for offline use. */
async function waitForSavedTasks(page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise((resolve, reject) => {
            const open = indexedDB.open('trackit-offline');
            open.onerror = () => reject(open.error);
            open.onsuccess = () => {
              const read = open.result.transaction('query-cache').objectStore('query-cache').getAll();
              read.onsuccess = () => resolve(JSON.stringify(read.result).includes('Statistics assignment'));
            };
          }),
      ),
    )
    .toBe(true);
}

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (buffer) => `${buffer.readUInt32BE(16)}x${buffer.readUInt32BE(20)}`;

test('is installable: a valid manifest and an active service worker', async ({ page, api }) => {
  void api;
  await page.goto('/landing');

  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  const response = await page.request.get(href);
  expect(response.headers()['content-type']).toContain('application/manifest+json');
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: expect.any(String),
    short_name: 'Trackit',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: expect.stringMatching(/^#[0-9A-F]{6}$/i),
    background_color: expect.stringMatching(/^#[0-9A-F]{6}$/i),
  });

  // Every icon exists, is a PNG of the declared size, and the set includes
  // the 192 and 512 pixel icons Chrome needs plus a maskable one.
  for (const icon of manifest.icons) {
    const file = await page.request.get(new URL(icon.src, response.url()).href);
    expect(file.status(), icon.src).toBe(200);
    expect(file.headers()['content-type']).toBe('image/png');
    expect(pngSize(await file.body()), icon.src).toBe(icon.sizes);
  }
  const kinds = manifest.icons.map((icon) => `${icon.sizes} ${icon.purpose ?? 'any'}`);
  expect(kinds).toEqual(expect.arrayContaining(['192x192 any', '512x512 any', '512x512 maskable']));

  const worker = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return { scope: registration.scope, script: registration.active.scriptURL };
  });
  expect(worker.scope).toBe(new URL('/', page.url()).href);
  expect(worker.script).toBe(new URL('/sw.js', page.url()).href);
});

for (const theme of ['light', 'dark']) {
  test(`shows the task list offline after one visit, with writes disabled (${theme})`, async ({ page, context, api, signIn }) => {
    seed(api);
    await signIn();
    await page.addInitScript((value) => localStorage.setItem('trackit_theme', value), theme);
    await page.goto('/tasks');
    await expect(page.getByText('Statistics assignment')).toBeVisible();
    await page.evaluate(() => navigator.serviceWorker.ready);
    await waitForSavedTasks(page);

    await context.setOffline(true);
    await page.reload();

    await expect(page.getByText(/You're offline, showing saved data/)).toBeVisible();
    await expect(page.getByText('Statistics assignment')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark "Lab report" as done' })).toBeDisabled();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(violations.map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) }))).toEqual([]);

    await page.goto('/add');
    await expect(page.getByRole('button', { name: 'Save Task' })).toBeDisabled();
    await expect(page.getByText("You're offline. Reconnect to save changes, chat or upload.")).toBeVisible();
  });
}

test('still shows saved tasks offline once the access token has expired', async ({ page, context, api, signIn }) => {
  seed(api);
  await signIn();
  await page.goto('/tasks');
  await expect(page.getByText('Statistics assignment')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await waitForSavedTasks(page);

  // Reopen the app hours later: the saved session's token has expired, and
  // it cannot be refreshed offline.
  await page.addInitScript(() => {
    const key = 'sb-127-auth-token';
    const saved = JSON.parse(localStorage.getItem(key));
    localStorage.setItem(key, JSON.stringify({ ...saved, expires_at: Math.floor(Date.now() / 1000) - 3600 }));
  });
  // Routed requests bypass offline emulation, so fail the refresh as the
  // network would.
  await page.route(`${SUPABASE_URL}/auth/v1/token**`, (route) => route.abort('internetdisconnected'));
  await context.setOffline(true);
  await page.reload();

  await expect(page.getByText(/You're offline, showing saved data/)).toBeVisible();
  await expect(page.getByText('Statistics assignment')).toBeVisible();
});

test('keeps API and Supabase responses out of the service worker cache', async ({ page, api, signIn }) => {
  seed(api);
  await signIn();
  await page.goto('/tasks');
  await expect(page.getByText('Statistics assignment')).toBeVisible();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // Now controlled by the service worker.
  await expect(page.getByText('Statistics assignment')).toBeVisible();

  const cached = await page.evaluate(async () => {
    const urls = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) urls.push(request.url);
    }
    return urls;
  });
  expect(cached.length).toBeGreaterThan(0);
  expect(cached.filter((url) => /\/api(\/|$)|:54321/.test(url))).toEqual([]);
});

import process from 'node:process';
import { DEFAULT_SITE_URL, resolveSiteUrl } from '../vite-plugins/site.js';
import { expect, test } from './fakes.js';

// The e2e build uses the same VITE_SITE_URL as this process (normally unset).
const SITE = resolveSiteUrl(process.env.VITE_SITE_URL ?? DEFAULT_SITE_URL);
const CANONICAL = `${SITE}/landing`;

const meta = (page, key) =>
  page.locator(`meta[property="${key}"], meta[name="${key}"]`).getAttribute('content');

/** Natural size of an image as the browser decodes it. */
const naturalSize = (page, src) =>
  page.evaluate(
    (url) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
        img.onerror = () => reject(new Error(`failed to load ${url}`));
        img.src = url;
      }),
    src,
  );

test.describe('landing page SEO', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/landing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('has one consistent title and description, and an absolute canonical URL', async ({ page }) => {
    const title = await page.title();
    expect(title).toMatch(/^Trackit/);
    expect(await meta(page, 'og:title')).toBe(title);
    expect(await meta(page, 'twitter:title')).toBe(title);

    const description = await meta(page, 'description');
    expect(description.length).toBeGreaterThan(50);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(await meta(page, 'twitter:description')).toBe(await meta(page, 'og:description'));

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', CANONICAL);
    expect(await meta(page, 'og:url')).toBe(CANONICAL);
    expect(await page.locator('meta[name="robots"]').count()).toBe(0);
  });

  test('points social cards at an absolute image whose declared size matches the file', async ({ page }) => {
    const image = await meta(page, 'og:image');
    expect(image).toBe(`${SITE}/trackit_og_image.jpg`);
    expect(await meta(page, 'twitter:image')).toBe(image);
    expect(await meta(page, 'twitter:card')).toBe('summary_large_image');
    expect(await meta(page, 'og:image:alt')).toBeTruthy();

    // Load the same file from this server: the absolute URL is the production host.
    const actual = await naturalSize(page, new URL(image).pathname);
    expect(actual).toEqual({
      width: Number(await meta(page, 'og:image:width')),
      height: Number(await meta(page, 'og:image:height')),
    });
    expect(actual.width / actual.height).toBeCloseTo(1.91, 1);
  });

  test('serves small icons and gives every image explicit dimensions', async ({ page, request }) => {
    for (const [href, max] of [['/favicon.ico', 16_000], ['/apple-touch-icon.png', 40_000]]) {
      const res = await request.get(href);
      expect(res.ok(), href).toBe(true);
      expect((await res.body()).length, href).toBeLessThan(max);
    }
    expect(await naturalSize(page, '/apple-touch-icon.png')).toEqual({ width: 180, height: 180 });

    // Images without width and height shift the layout when they load.
    const images = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({ src: img.src, width: img.getAttribute('width'), height: img.getAttribute('height') })),
    );
    for (const img of images) {
      expect(img.width && img.height, `${img.src} needs width and height`).toBeTruthy();
    }
  });

  test('describes the app with WebApplication structured data', async ({ page }) => {
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks).toHaveLength(1);
    const data = JSON.parse(blocks[0]);
    expect(data).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Trackit',
      url: CANONICAL,
      image: `${SITE}/trackit_og_image.jpg`,
    });
    // The automatic cspViolations fixture fails the test if the block tripped the policy.
  });

  test('preloads the landing chunk and does not shift the layout while loading', async ({ page }) => {
    await expect(page.locator('link[rel="modulepreload"][href*="/Landing-"]')).toHaveCount(1);
    const shift = await page.evaluate(
      () =>
        new Promise((resolve) => {
          let total = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) if (!entry.hadRecentInput) total += entry.value;
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(total), 500);
        }),
    );
    expect(shift).toBeLessThan(0.1);
  });
});

test('publishes robots.txt and a sitemap listing only the landing page', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('User-agent: *');
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap.xml`);
  expect(robots).not.toMatch(/Disallow: \/\s*$/m);

  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.headers()['content-type']).toMatch(/xml/);
  const locs = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs).toEqual([CANONICAL]);
});

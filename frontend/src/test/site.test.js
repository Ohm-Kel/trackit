// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_SITE_URL, PUBLIC_PATHS, resolveSiteUrl, robotsTxt, siteMetadata, sitemapXml } from '../../vite-plugins/site.js';

describe('site metadata build plugin', () => {
  it('defaults to the production URL and normalises a configured origin', () => {
    expect(resolveSiteUrl(undefined)).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl('  ')).toBe(DEFAULT_SITE_URL);
    expect(resolveSiteUrl('https://trackit.example.edu/')).toBe('https://trackit.example.edu');
  });

  it('rejects values that would produce broken absolute URLs', () => {
    expect(() => resolveSiteUrl('trackit.example.edu')).toThrow(/VITE_SITE_URL/);
    expect(() => resolveSiteUrl('https://example.edu/app')).toThrow(/no path/);
    expect(() => resolveSiteUrl('ftp://example.edu')).toThrow(/http/);
  });

  it('fills the site URL into index.html', () => {
    const html = siteMetadata('https://trackit.example.edu').transformIndexHtml.handler(
      '<link rel="canonical" href="%SITE_URL%/landing" /><meta property="og:image" content="%SITE_URL%/og.jpg" />',
    );
    expect(html).toBe(
      '<link rel="canonical" href="https://trackit.example.edu/landing" /><meta property="og:image" content="https://trackit.example.edu/og.jpg" />',
    );
  });

  it('lists only the public pages in robots.txt and the sitemap', () => {
    expect(robotsTxt('https://t.example')).toContain('Sitemap: https://t.example/sitemap.xml');
    expect(sitemapXml('https://t.example')).toContain('<loc>https://t.example/landing</loc>');
    expect(sitemapXml('https://t.example').match(/<loc>/g)).toHaveLength(PUBLIC_PATHS.length);
  });

  it('keeps vercel.json sending noindex for app routes only', () => {
    const { headers } = JSON.parse(readFileSync(new URL('../../../vercel.json', import.meta.url), 'utf8'));
    const rule = headers.find((h) => h.headers.some((x) => x.key === 'X-Robots-Tag'));
    const noindex = new RegExp(`^${rule.source}$`);
    for (const path of ['/tasks', '/exams', '/settings', '/login', '/signup', '/reset-password']) {
      expect(noindex.test(path), path).toBe(true);
    }
    for (const path of ['/', ...PUBLIC_PATHS, '/robots.txt', '/sitemap.xml', '/trackit_og_image.jpg', '/assets/x.js']) {
      expect(noindex.test(path), path).toBe(false);
    }
  });
});

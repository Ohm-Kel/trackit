/**
 * Site metadata for search engines and social cards. Canonical, Open Graph
 * and structured-data URLs must be absolute, so they are built from
 * VITE_SITE_URL (the public origin) rather than written into index.html.
 */
export const DEFAULT_SITE_URL = 'https://trackit-app-smoky.vercel.app';

/** Pages that search engines may index. Every other route is sent with `X-Robots-Tag: noindex`. */
export const PUBLIC_PATHS = ['/landing'];

export function resolveSiteUrl(value) {
  const raw = value?.trim() || DEFAULT_SITE_URL;
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`VITE_SITE_URL must be an absolute URL such as ${DEFAULT_SITE_URL}, got "${raw}"`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
    throw new Error(`VITE_SITE_URL must be an http(s) origin with no path, got "${raw}"`);
  }
  return url.origin;
}

export function robotsTxt(siteUrl) {
  return ['User-agent: *', 'Disallow: /api/', '', `Sitemap: ${siteUrl}/sitemap.xml`, ''].join('\n');
}

export function sitemapXml(siteUrl) {
  const urls = PUBLIC_PATHS.map((path) => `  <url><loc>${siteUrl}${path}</loc></url>`);
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Replace %SITE_URL% in index.html and emit robots.txt and sitemap.xml (also
 * served by the dev server).
 */
export function siteMetadata(value) {
  const siteUrl = resolveSiteUrl(value);
  const files = {
    '/robots.txt': ['text/plain', robotsTxt(siteUrl)],
    '/sitemap.xml': ['application/xml', sitemapXml(siteUrl)],
  };
  return {
    name: 'trackit-site-metadata',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html.replaceAll('%SITE_URL%', siteUrl),
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = files[req.url];
        if (!file) return next();
        res.setHeader('Content-Type', `${file[0]}; charset=utf-8`);
        res.end(file[1]);
      });
    },
    generateBundle() {
      for (const [path, [, source]] of Object.entries(files)) {
        this.emitFile({ type: 'asset', fileName: path.slice(1), source });
      }
    },
  };
}

/**
 * Add <link rel="modulepreload"> tags for a lazily loaded page and the chunks
 * it imports, so the browser fetches them alongside the entry instead of
 * after it has run. Used for the landing page, which is the first page every
 * signed-out visitor sees (they are redirected there from `/`).
 */
export function preloadLazyPage(modulePath) {
  let base = '/';
  return {
    name: 'trackit-preload-lazy-page',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, { bundle }) {
        const chunks = Object.values(bundle ?? {}).filter((c) => c.type === 'chunk');
        const page = chunks.find((c) => c.facadeModuleId?.replaceAll('\\', '/').endsWith(modulePath));
        if (!page) throw new Error(`preloadLazyPage: no chunk found for ${modulePath}`);

        const byName = Object.fromEntries(chunks.map((c) => [c.fileName, c]));
        const withImports = (start) => {
          const seen = new Set();
          const visit = (name) => {
            if (seen.has(name)) return;
            seen.add(name);
            byName[name]?.imports.forEach(visit);
          };
          start.forEach(visit);
          return seen;
        };
        // Chunks the entry already loads get their own preload from Vite.
        const loaded = withImports(chunks.filter((c) => c.isEntry).map((c) => c.fileName));
        return [...withImports([page.fileName])]
          .filter((name) => !loaded.has(name))
          .map((name) => ({
            tag: 'link',
            attrs: { rel: 'modulepreload', crossorigin: true, href: `${base}${name}` },
            injectTo: 'head',
          }));
      },
    },
  };
}

import process from 'node:process'
import { readFileSync } from 'node:fs'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { preloadLazyPage } from './vite-plugins/preload.js'
import { siteMetadata } from './vite-plugins/site.js'

/**
 * Add a Content-Security-Policy <meta> tag to production builds, allowing
 * connections only to this app and the configured Supabase project (also when
 * it uses a custom domain). Directives that a <meta> policy cannot carry,
 * such as frame-ancestors, are sent as headers by vercel.json and nginx.conf.
 */
export function contentSecurityPolicy(supabaseUrl) {
  return {
    name: 'trackit-content-security-policy',
    apply: 'build',
    transformIndexHtml() {
      let supabase;
      try {
        supabase = new URL(supabaseUrl);
      } catch {
        throw new Error('VITE_SUPABASE_URL must be set to a valid URL to build the app');
      }
      const realtime = `${supabase.protocol === 'http:' ? 'ws' : 'wss'}://${supabase.host}`;
      const policy = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self' data:",
        "img-src 'self' data: blob: https:",
        `connect-src 'self' ${supabase.origin} ${realtime}`,
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; ');
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: policy },
          injectTo: 'head-prepend',
        },
      ];
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
  return {
    plugins: [
      react(),
      contentSecurityPolicy(env.VITE_SUPABASE_URL),
      siteMetadata(env.VITE_SITE_URL),
      preloadLazyPage('src/pages/Landing.jsx'),
    ],
    // Shown in Settings; kept in step with the release by package.json.
    define: { 'import.meta.env.VITE_APP_VERSION': JSON.stringify(version) },
    build: {
      rollupOptions: {
        output: {
          // Libraries change far less often than app code. Separate chunks
          // let browsers keep them cached across deploys.
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;
            if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom)\//.test(id)) return 'react';
            if (id.includes('node_modules/@supabase/')) return 'supabase';
            if (id.includes('node_modules/@tanstack/')) return 'query';
            return undefined;
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      exclude: ['e2e/**', 'node_modules/**'],
      setupFiles: ['./src/test/setup.js'],
      // Above the 5s findBy*/waitFor timeout in setup.js, so a slow query on a
      // busy CI runner gets its own clear error rather than a whole-test timeout.
      testTimeout: 15_000,
      env: {
        VITE_SUPABASE_URL: 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key',
        // Same relative base as production, so URL handling matches the
        // deployed app (a relative base once broke `new URL(...)` calls).
        VITE_API_URL: '/api',
      },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{js,jsx}'],
        exclude: ['src/test/**', 'src/main.jsx', 'src/**/*.test.{js,jsx}'],
        thresholds: { lines: 75 },
      },
    },
  };
})

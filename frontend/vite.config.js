import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

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

/**
 * Installable app and offline shell (ADR 0007). The service worker precaches
 * only the built app shell. It has no runtime caching, so API responses
 * (including /api/chat/stream) and Supabase auth calls always go to the
 * network; signed-in data is kept offline by React Query's per-user
 * IndexedDB persister instead (src/lib/queryPersistence.js).
 */
export const pwaOptions = {
  // Wait for the user to accept an update rather than swapping code under
  // an open page (UpdatePrompt.jsx).
  registerType: 'prompt',
  // Registered from the bundle (UpdatePrompt.jsx), so no inline script is
  // needed under the Content-Security-Policy.
  injectRegister: false,
  manifest: {
    id: '/',
    name: 'Trackit: AI study planner',
    short_name: 'Trackit',
    description: 'Track assignments and exams, plan study sessions, and ask an AI assistant that knows your workload.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    // Matches <meta name="theme-color"> and the light theme's --color-bg.
    theme_color: '#0F172A',
    background_color: '#F8FAFC',
    categories: ['education', 'productivity'],
    icons: [
      { src: '/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
      { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
    // Not shown in the app: the browser fetches install icons itself when
    // it reads the manifest, and the rest are for link previews or unused.
    globIgnores: ['**/pwa-*.png', '**/maskable-*.png', '**/apple-touch-icon-*.png', '**/trackit_og_image.png', '**/vite.svg'],
    // Deep links open the cached shell offline, except API paths, which
    // must reach the API (or fail) rather than receive index.html.
    navigateFallback: '/index.html',
    navigateFallbackDenylist: [/^\/api(\/|$)/],
    cleanupOutdatedCaches: true,
    runtimeCaching: [],
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), contentSecurityPolicy(env.VITE_SUPABASE_URL), VitePWA(pwaOptions)],
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

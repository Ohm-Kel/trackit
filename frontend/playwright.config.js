import process from 'node:process';
import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run the production build in Chromium. The API and
// Supabase are faked at the network layer (e2e/fakes.js), so no backend or
// credentials are needed; the build's real Content-Security-Policy applies.
const PORT = 4173;
export const SUPABASE_URL = 'http://127.0.0.1:54321';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { VITE_SUPABASE_URL: SUPABASE_URL, VITE_SUPABASE_ANON_KEY: 'e2e-anon-key' },
  },
});

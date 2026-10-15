import { render } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { vi } from 'vitest';
import AppProviders from '../AppProviders';
import App from '../App';
import { createFakeApi } from './fakeApi';
import { resetSupabase, signInAs } from './fakeSupabase';

/**
 * Render the whole app, with the same providers as main.jsx, at `path`.
 * Network calls go to an in-memory fake API, and auth to a fake Supabase.
 *
 * Test files must mock the Supabase client first:
 *   vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));
 *
 * @param {string} path
 * @param {{ signedIn?: boolean, tour?: boolean, setup?: (api: ReturnType<typeof createFakeApi>) => void }} [options]
 *   tour: show the first-run onboarding tour (hidden by default).
 */
export function renderApp(path, { signedIn = true, setup, tour = false } = {}) {
  resetSupabase();
  if (signedIn) signInAs();
  if (!tour) localStorage.setItem('trackit_onboarding_done', 'true');

  const api = createFakeApi();
  setup?.(api);
  vi.stubGlobal('fetch', vi.fn(api.fetch));

  window.history.pushState({}, '', path);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const utils = render(
    <AppProviders queryClient={queryClient}>
      <App />
    </AppProviders>,
  );
  return { ...utils, api, queryClient };
}

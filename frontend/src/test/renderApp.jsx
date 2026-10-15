import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { ToastProvider } from '../components/Toast';
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
 * @param {{ signedIn?: boolean, setup?: (api: ReturnType<typeof createFakeApi>) => void }} [options]
 */
export function renderApp(path, { signedIn = true, setup } = {}) {
  resetSupabase();
  if (signedIn) signInAs();
  localStorage.setItem('trackit_onboarding_done', 'true');

  const api = createFakeApi();
  setup?.(api);
  vi.stubGlobal('fetch', vi.fn(api.fetch));

  window.history.pushState({}, '', path);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return { ...utils, api, queryClient };
}

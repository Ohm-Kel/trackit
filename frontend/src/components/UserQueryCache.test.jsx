import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onlineManager } from '@tanstack/react-query';
import { AuthRetryableFetchError } from '@supabase/supabase-js';
import { renderApp } from '../test/renderApp';
import { inDays, task } from '../test/fakeApi';
import { signInAs, supabase, USER } from '../test/fakeSupabase';
import { createStore, keys, set } from 'idb-keyval';
import { cacheKey, readUserCache } from '../lib/queryPersistence';

vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));

const user = userEvent.setup();
const goOffline = () => act(() => onlineManager.setOnline(false));

const seed = (api) =>
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(3) }),
    task({ title: 'Lab report', status: 'not_started', due_date: inDays(5) }),
  );

const OTHER_ID = '22222222-2222-4222-8222-222222222222';

/** Save a cache for another user, as if they had closed the app without signing out. */
async function saveOtherUsersCache() {
  const store = createStore('trackit-offline', 'query-cache');
  const otherTasks = [task({ title: 'Kofi private essay', due_date: inDays(1) })];
  await set(
    cacheKey(OTHER_ID),
    {
      timestamp: Date.now(),
      buster: '1',
      clientState: {
        mutations: [],
        queries: [{ queryKey: ['tasks'], queryHash: '["tasks"]', state: { data: otherTasks, status: 'success', dataUpdatedAt: Date.now() } }],
      },
    },
    store,
  );
  return store;
}

/** Wait until the persister has saved the task list to IndexedDB. */
async function waitForSavedTasks(userId = USER.id) {
  await waitFor(
    async () => {
      const saved = await readUserCache(userId);
      const tasks = saved?.clientState.queries.find((q) => q.queryKey[0] === 'tasks');
      expect(tasks?.state.data).toHaveLength(2);
    },
    { timeout: 3000 },
  );
}

describe('saved data', () => {
  it('shows the last loaded tasks when the app is opened offline', async () => {
    const first = renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();
    first.unmount();

    onlineManager.setOnline(false);
    const { api } = renderApp('/tasks');
    expect(await screen.findByText('Statistics assignment')).toBeInTheDocument();
    expect(screen.getByText('Lab report')).toBeInTheDocument();
    expect(api.callsTo('GET /tasks')).toEqual([]);
  });

  it('is deleted, with the in-memory cache, when the user signs out', async () => {
    const { queryClient } = renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();

    await user.click(screen.getByRole('button', { name: /Sign out/ }));

    await waitFor(async () => expect(await readUserCache(USER.id)).toBeUndefined());
    expect(queryClient.getQueryData(['tasks'])).toBeUndefined();
    // A write the persister had queued must not save the data again.
    await new Promise((resolve) => setTimeout(resolve, 1200));
    expect(await readUserCache(USER.id)).toBeUndefined();
  });

  it('is deleted even if the sign-out request fails offline', async () => {
    renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();
    supabase.auth.signOut.mockResolvedValueOnce({ error: { message: 'Failed to fetch' } });

    goOffline();
    await user.click(screen.getByRole('button', { name: /Sign out/ }));
    await waitFor(async () => expect(await readUserCache(USER.id)).toBeUndefined());
  });

  it('is shown offline even after the access token has expired', async () => {
    const first = renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();
    first.unmount();

    // supabase-js keeps the saved session but cannot refresh its token offline.
    onlineManager.setOnline(false);
    renderApp('/tasks', {
      signedIn: false,
      setup: () => {
        localStorage.setItem(supabase.auth.storageKey, JSON.stringify({ access_token: 'expired', user: USER }));
        supabase.auth.getSession.mockResolvedValueOnce({
          data: { session: null },
          error: new AuthRetryableFetchError('Failed to fetch', 0),
        });
      },
    });
    expect(await screen.findByText('Statistics assignment')).toBeInTheDocument();
  });

  it('is shown offline without waiting for supabase-js to give up refreshing the token', async () => {
    const first = renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();
    first.unmount();

    onlineManager.setOnline(false);
    renderApp('/tasks', {
      signedIn: false,
      setup: () => {
        localStorage.setItem(supabase.auth.storageKey, JSON.stringify({ access_token: 'expired', user: USER }));
        supabase.auth.getSession.mockReturnValueOnce(new Promise(() => {})); // still retrying
      },
    });
    expect(await screen.findByText('Statistics assignment')).toBeInTheDocument();
  });

  it('is never restored for a different user', async () => {
    const first = renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    await waitForSavedTasks();
    first.unmount();

    onlineManager.setOnline(false);
    const other = { ...USER, id: '22222222-2222-4222-8222-222222222222', email: 'kofi@example.edu' };
    renderApp('/tasks', { signedIn: false, setup: () => signInAs(other) });
    expect(await screen.findByText('No tasks yet')).toBeInTheDocument();
    expect(screen.queryByText('Statistics assignment')).not.toBeInTheDocument();
  });

  it("deletes a user's cache left behind without signing out once someone else signs in", async () => {
    const store = await saveOtherUsersCache();
    renderApp('/tasks', { setup: seed });

    expect(await screen.findByText('Statistics assignment')).toBeInTheDocument();
    expect(screen.queryByText('Kofi private essay')).not.toBeInTheDocument();
    await waitFor(async () => expect(await readUserCache(OTHER_ID)).toBeUndefined());
    await waitForSavedTasks();
    expect(await keys(store)).toEqual([cacheKey(USER.id)]);
  });

  it('deletes every saved cache when the app opens with nobody signed in', async () => {
    const store = await saveOtherUsersCache();
    renderApp('/landing', { signedIn: false });
    await waitFor(async () => expect(await keys(store)).toEqual([]));
  });
});

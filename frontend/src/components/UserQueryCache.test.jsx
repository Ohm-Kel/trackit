import { describe, expect, it, vi } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { onlineManager } from '@tanstack/react-query';
import { renderApp } from '../test/renderApp';
import { inDays, task } from '../test/fakeApi';
import { signInAs, supabase, USER } from '../test/fakeSupabase';
import { readUserCache } from '../lib/queryPersistence';

vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));

const user = userEvent.setup();
const goOffline = () => act(() => onlineManager.setOnline(false));

const seed = (api) =>
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(3) }),
    task({ title: 'Lab report', status: 'not_started', due_date: inDays(5) }),
  );

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
});

import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { renderApp } from '../test/renderApp';
import { UPDATE_CHECK_INTERVAL_MS } from './updateChecks';
import { inDays, task } from '../test/fakeApi';

vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));

// The service worker registration hook, driven by each test.
const sw = vi.hoisted(() => ({ needRefresh: false, updateServiceWorker: null, options: null }));
vi.mock('virtual:pwa-register/react', async () => {
  const { useState } = await import('react');
  return {
    useRegisterSW: (options) => {
      sw.options = options;
      return {
        needRefresh: useState(sw.needRefresh),
        offlineReady: useState(false),
        updateServiceWorker: sw.updateServiceWorker,
      };
    },
  };
});

const user = userEvent.setup();
const seed = (api) => api.db.tasks.push(task({ title: 'Statistics assignment', due_date: inDays(3) }));

describe('update prompt', () => {
  it('asks before reloading into a new version', async () => {
    sw.needRefresh = true;
    sw.updateServiceWorker = vi.fn(async () => {});
    renderApp('/tasks', { setup: seed });

    const prompt = await screen.findByRole('alertdialog', { name: 'A new version of Trackit is available.' });
    expect(sw.updateServiceWorker).not.toHaveBeenCalled();
    const { violations } = await axe.run(prompt, { rules: { 'color-contrast': { enabled: false } } });
    expect(violations.map((v) => v.id)).toEqual([]);
    await user.click(within(prompt).getByRole('button', { name: 'Reload' }));
    expect(sw.updateServiceWorker).toHaveBeenCalledWith(true);
  });

  it('can be dismissed until the next visit', async () => {
    sw.needRefresh = true;
    sw.updateServiceWorker = vi.fn(async () => {});
    renderApp('/tasks', { setup: seed });

    await user.click(await screen.findByRole('button', { name: 'Later' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(sw.updateServiceWorker).not.toHaveBeenCalled();
  });

  it('stays hidden when there is no new version', async () => {
    sw.needRefresh = false;
    renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('checks for a new version every hour while online, for apps left open', async () => {
    sw.needRefresh = false;
    renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');

    vi.useFakeTimers();
    const onLine = vi.spyOn(navigator, 'onLine', 'get');
    try {
      const registration = { update: vi.fn(async () => {}) };
      sw.options.onRegisteredSW('/sw.js', registration);
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
      expect(registration.update).toHaveBeenCalledTimes(1);

      onLine.mockReturnValue(false);
      vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS);
      expect(registration.update).toHaveBeenCalledTimes(1);
    } finally {
      vi.clearAllTimers();
      vi.useRealTimers();
      onLine.mockRestore();
    }
  });
});


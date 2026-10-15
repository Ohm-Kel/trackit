import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { renderApp } from './renderApp';
import { exam, inDays, task } from './fakeApi';

vi.mock('../lib/supabaseClient', () => import('./fakeSupabase'));

let user;
let downloads;
beforeEach(() => {
  user = userEvent.setup();
  downloads = [];
  // Capture the file handed to the download link instead of saving it.
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    downloads.push({ blob });
    return 'blob:test';
  });
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click() {
    if (this.href.startsWith('blob:')) downloads.at(-1).filename = this.download;
  });
});
afterEach(() => vi.restoreAllMocks());

async function openCalendarSettings(options) {
  const app = renderApp('/settings', options);
  await user.click(await screen.findByRole('button', { name: 'Calendar' }));
  await screen.findByText('Calendar subscription');
  return app;
}

async function violations(container) {
  const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
  return result.violations.map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 120)) }));
}

describe('calendar subscription settings', () => {
  it('creates a link, shows it once with instructions, and copies it', async () => {
    const { api, container } = await openCalendarSettings();
    expect(await screen.findByText(/don't have a subscription link yet/)).toBeInTheDocument();
    for (const app of ['Google Calendar:', 'Apple Calendar:', 'Outlook:']) {
      expect(screen.getByText(app)).toBeInTheDocument();
    }

    await user.click(screen.getByRole('button', { name: 'Create subscription link' }));

    const input = await screen.findByLabelText('Your subscription link');
    const { token } = api.db.calendarFeed;
    expect(input).toHaveValue(`${window.location.origin}/api/calendar/${token}.ics`);
    expect(screen.getByRole('link', { name: /open in calendar app/i })).toHaveAttribute(
      'href',
      `webcal://${window.location.host}/api/calendar/${token}.ics`,
    );
    expect(screen.getByText(/keep this link private/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Copy link' }));
    expect(await navigator.clipboard.readText()).toBe(input.value);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);
  });

  it('explains that an existing link cannot be shown again, and rotates it', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { api, container } = await openCalendarSettings({
      setup: (a) => {
        a.db.calendarFeed = { token: 'old', created_at: '2026-10-01T09:00:00Z' };
      },
    });
    expect(await screen.findByText('Your subscription link is active')).toBeInTheDocument();
    expect(screen.getByText(/1 October 2026/)).toBeInTheDocument();
    expect(await violations(container)).toEqual([]);

    // Cancelling the confirmation changes nothing.
    await user.click(screen.getByRole('button', { name: 'Create new link' }));
    expect(api.callsTo('POST /calendar/feed')).toHaveLength(0);

    confirm.mockReturnValue(true);
    await user.click(screen.getByRole('button', { name: 'Create new link' }));
    const input = await screen.findByLabelText('Your subscription link');
    expect(api.db.calendarFeed.token).not.toBe('old');
    expect(input.value).toContain(api.db.calendarFeed.token);
  });

  it('revokes the link', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { api } = await openCalendarSettings({
      setup: (a) => {
        a.db.calendarFeed = { token: 'old', created_at: '2026-10-01T09:00:00Z' };
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Revoke link' }));

    expect(await screen.findByText(/don't have a subscription link yet/)).toBeInTheDocument();
    expect(await screen.findByText('Link revoked')).toBeInTheDocument();
    expect(api.db.calendarFeed).toBeNull();
    expect(screen.queryByLabelText('Your subscription link')).not.toBeInTheDocument();
  });

  it('shows the error and retries when the link status cannot be loaded', async () => {
    let fail = true;
    await openCalendarSettings({
      setup: (a) =>
        a.on('GET /calendar/feed', () =>
          fail ? a.json({ error: 'Internal server error' }, 500) : a.json({ active: false, created_at: null }),
        ),
    });
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Internal server error');

    fail = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText(/don't have a subscription link yet/)).toBeInTheDocument();
  });

  it('reports a failure to create a link', async () => {
    await openCalendarSettings({
      setup: (a) => a.on('POST /calendar/feed', () => a.json({ error: 'Too many requests. Please slow down.' }, 429)),
    });
    await user.click(await screen.findByRole('button', { name: 'Create subscription link' }));
    expect(await screen.findByText('Too many requests. Please slow down.')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your subscription link')).not.toBeInTheDocument();
  });
});

describe('Download .ics', () => {
  const seed = (api) => {
    api.db.tasks.push(
      task({ title: 'Essay, part 1', due_date: inDays(3) }),
      task({ title: 'Finished', status: 'done', due_date: inDays(1) }),
    );
    api.db.exams.push(exam({ subject: 'Calculus II', exam_date: inDays(10) }));
  };

  it.each([
    ['/tasks', 'All Tasks', 'tasks', 'Due: Essay, part 1'],
    ['/exams', 'Exam Countdown', 'exams', 'Exam: Calculus II'],
  ])('downloads %s as a calendar file', async (path, heading, include, summary) => {
    const { api } = renderApp(path, { setup: seed });
    await screen.findByRole('heading', { level: 1, name: heading });
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('button', { name: 'Download .ics' }));

    await waitFor(() => expect(downloads).toHaveLength(1));
    const [{ blob, filename }] = downloads;
    expect(filename).toBe(`trackit-${include}.ics`);
    expect(blob.type).toBe('text/calendar;charset=utf-8');
    const text = await blob.text();
    expect(text).toContain(`SUMMARY:${summary}`);
    expect(text).not.toContain('Finished');
    expect(api.callsTo('GET /calendar/export.ics')[0].query).toBe(`?include=${include}`);
  });

  it('tells the user when the download fails', async () => {
    renderApp('/tasks', {
      setup: (api) => {
        seed(api);
        api.on('GET /calendar/export.ics', () => api.json({ error: 'Internal server error' }, 500));
      },
    });
    await screen.findByRole('heading', { level: 1, name: 'All Tasks' });
    await user.click(screen.getByRole('button', { name: 'Export' }));
    await user.click(screen.getByRole('button', { name: 'Download .ics' }));
    expect(await screen.findByText("Couldn't download the calendar file")).toBeInTheDocument();
    expect(downloads).toHaveLength(0);
  });
});

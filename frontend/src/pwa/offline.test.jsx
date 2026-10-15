import { describe, expect, it, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { onlineManager } from '@tanstack/react-query';
import { renderApp } from '../test/renderApp';
import { inDays, task } from '../test/fakeApi';

vi.mock('../lib/supabaseClient', () => import('../test/fakeSupabase'));

const user = userEvent.setup();
const goOffline = () => act(() => onlineManager.setOnline(false));
const goOnline = () => act(() => onlineManager.setOnline(true));

const seed = (api) =>
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(3) }),
    task({ title: 'Lab report', status: 'not_started', due_date: inDays(5) }),
  );

describe('offline banner', () => {
  it('appears while offline, keeps showing loaded data, and goes when back online', async () => {
    renderApp('/tasks', { setup: seed });
    await screen.findByText('Statistics assignment');
    expect(screen.queryByText(/You're offline, showing saved data/)).not.toBeInTheDocument();

    goOffline();
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/You're offline, showing saved data/);
    expect((await axe.run(banner)).violations.map((v) => v.id)).toEqual([]);
    expect(screen.getByText('Statistics assignment')).toBeInTheDocument();

    goOnline();
    expect(screen.queryByText(/You're offline, showing saved data/)).not.toBeInTheDocument();
  });
});

describe('writes while offline', () => {
  it('disables saving a new task, with the reason', async () => {
    const { api } = renderApp('/add');
    await user.type(await screen.findByLabelText('Task Name *'), 'Essay draft');
    goOffline();

    const save = screen.getByRole('button', { name: 'Save Task' });
    expect(save).toBeDisabled();
    expect(save).toHaveAccessibleDescription(/You're offline. Reconnect to save changes/);
    await user.click(save);
    expect(api.callsTo('POST /tasks')).toEqual([]);

    goOnline();
    expect(save).toBeEnabled();
  });

  it('disables sending a chat message', async () => {
    renderApp('/chat');
    const message = await screen.findByRole('textbox', { name: 'Message' });
    goOffline();
    expect(message).toBeDisabled();
    expect(message).toHaveAccessibleDescription(/You're offline/);
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled();
  });

  it('disables uploads', async () => {
    renderApp('/upload');
    await screen.findByRole('heading', { name: 'Upload Timetable' });
    goOffline();
    expect(screen.getByLabelText('Exam timetable file')).toBeDisabled();
    expect(screen.getByText(/You're offline. Reconnect to save changes/)).toBeInTheDocument();
  });

  it('disables completing and deleting tasks', async () => {
    const { api } = renderApp('/tasks', { setup: seed });
    const toggle = await screen.findByRole('button', { name: 'Mark "Lab report" as done' });
    goOffline();
    expect(toggle).toBeDisabled();
    for (const button of screen.getAllByRole('button', { name: 'Delete' })) expect(button).toBeDisabled();
    await user.click(toggle);
    expect(api.calls.filter((c) => c.path.startsWith('/tasks') && c.method !== 'GET')).toEqual([]);
  });
});

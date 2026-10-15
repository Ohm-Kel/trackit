import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './renderApp';
import { inDays, task } from './fakeApi';
import { supabase } from './fakeSupabase';

vi.mock('../lib/supabaseClient', () => import('./fakeSupabase'));

let user;
beforeEach(() => {
  user = userEvent.setup();
});

const TODAY = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()];

describe('account pages', () => {
  async function fillSignup(password, confirm = password, { email = true } = {}) {
    if (email) await user.type(await screen.findByLabelText('Email Address'), 'new@example.edu');
    await user.type(screen.getByLabelText('Password'), password);
    await user.type(screen.getByLabelText('Confirm Password'), confirm);
    await user.click(screen.getByRole('button', { name: /create account/i }));
  }

  it('rejects a weak or mismatched password on sign-up without calling Supabase', async () => {
    renderApp('/signup', { signedIn: false });
    await fillSignup('short');
    expect(await screen.findByText(/at least 8 characters/)).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Password'));
    await user.clear(screen.getByLabelText('Confirm Password'));
    await fillSignup('correct-horse-9', 'different-horse-9', { email: false });
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(supabase.auth.signUp).not.toHaveBeenCalled();
  });

  it('creates the account and asks the user to confirm their email', async () => {
    renderApp('/signup', { signedIn: false });
    await fillSignup('correct-horse-9');
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(supabase.auth.signUp).toHaveBeenCalledWith({ email: 'new@example.edu', password: 'correct-horse-9' });
  });

  it('applies the same password rule when resetting a password', async () => {
    renderApp('/reset-password', { signedIn: false });
    await user.type(await screen.findByLabelText('New Password'), 'abcdef');
    await user.type(screen.getByLabelText('Confirm Password'), 'abcdef');
    await user.click(screen.getByRole('button', { name: /update password|reset|save/i }));
    expect(await screen.findByText(/at least 8 characters/)).toBeInTheDocument();
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();

    for (const label of ['New Password', 'Confirm Password']) {
      await user.clear(screen.getByLabelText(label));
      await user.type(screen.getByLabelText(label), 'correct-horse-9');
    }
    await user.click(screen.getByRole('button', { name: /update password|reset|save/i }));
    await waitFor(() => expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'correct-horse-9' }));
  });

  it('sends a password reset email', async () => {
    renderApp('/forgot-password', { signedIn: false });
    await user.type(await screen.findByLabelText('Email Address'), 'ama@example.edu');
    await user.click(screen.getByRole('button', { name: /send|reset/i }));
    expect(await screen.findByText(/check your email/i)).toBeInTheDocument();
    expect(supabase.auth.resetPasswordForEmail.mock.calls[0][0]).toBe('ama@example.edu');
  });
});

describe('focus plan', () => {
  const tasks = (fake) =>
    fake.db.tasks.push(
      task({ title: 'Statistics assignment', due_date: inDays(1), estimated_hours: 2 }),
      task({ title: 'Lab report', due_date: inDays(5) }),
    );

  it('schedules tasks into the free windows around today’s classes', async () => {
    renderApp('/focus', {
      setup: (fake) => {
        tasks(fake);
        fake.db.profile.weekly_schedule = { [TODAY]: [{ start: '08:00', end: '13:00' }] };
      },
    });
    expect((await screen.findAllByText('Statistics assignment')).length).toBeGreaterThan(0);
    expect(screen.getByText('Schedule-aware')).toBeInTheDocument();
    expect(screen.getByText(/Afternoon \(1:00 PM – 9:00 PM\)/)).toBeInTheDocument();
  });

  it('says so when classes leave no free window, instead of overlapping them', async () => {
    renderApp('/focus', {
      setup: (fake) => {
        tasks(fake);
        fake.db.profile.weekly_schedule = { [TODAY]: [{ start: '08:00', end: '21:00' }] };
      },
    });
    expect(await screen.findByText('No free study window today')).toBeInTheDocument();
    expect(screen.queryByText(/Morning \(/)).not.toBeInTheDocument();
  });

  it('marks a planned task done', async () => {
    const { api } = renderApp('/focus', { setup: tasks });
    await user.click(await screen.findByRole('button', { name: 'Mark "Statistics assignment" as done' }));
    await waitFor(() => expect(api.db.tasks[0].status).toBe('done'));
  });
});

describe('notifications', () => {
  it('lists notifications and marks them all as read', async () => {
    const { api } = renderApp('/', {
      setup: (fake) =>
        fake.db.notifications.push(
          { id: 'n1', type: 'info', message: 'Essay due tomorrow', read_status: false, created_at: new Date().toISOString() },
          { id: 'n2', type: 'warning', message: 'Three deadlines this week', read_status: false, created_at: new Date().toISOString() },
        ),
    });
    const bell = (await screen.findAllByRole('button', { name: 'Notifications, 2 unread' }))[0];
    await user.click(bell);
    expect(await screen.findByText('Essay due tomorrow')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(api.db.notifications.every((n) => n.read_status)).toBe(true));
  });
});

describe('onboarding tour', () => {
  it('shows on the first visit, walks through the steps, and stays closed after Escape', async () => {
    renderApp('/', { tour: true });
    const dialog = await screen.findByRole('dialog', {}, { timeout: 3000 });
    expect(dialog).toHaveTextContent('Step 1 of');
    expect(screen.getByRole('button', { name: 'Next' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Step 2 of');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(localStorage.getItem('trackit_onboarding_done')).toBe('true');
  });
});

describe('due-date urgency', () => {
  it('colours the phone task row by urgency, without a stray separator', async () => {
    renderApp('/tasks', {
      setup: (fake) =>
        fake.db.tasks.push(
          task({ title: 'Lab report', due_date: inDays(-1) }),
          task({ title: 'Essay', course_code: 'ENG101', due_date: inDays(10) }),
        ),
    });
    const lab = (await screen.findByText('Lab report')).nextElementSibling;
    const phoneDue = lab.querySelector('.lg\\:hidden');
    expect(phoneDue.textContent).toBe('Overdue');
    expect(phoneDue.firstElementChild).toHaveClass('text-error');

    const essay = screen.getByText('Essay').nextElementSibling.querySelector('.lg\\:hidden');
    expect(essay.textContent).toMatch(/^ · \S/);
    expect(essay.firstElementChild).toHaveClass('text-text-3');
  });

  it('marks only urgent tasks with a red dot in the Dashboard queue', async () => {
    renderApp('/', {
      setup: (fake) =>
        fake.db.tasks.push(task({ title: 'Lab report', due_date: inDays(0) }), task({ title: 'Essay', due_date: inDays(10) })),
    });
    const dot = (title) => screen.getByText(title).parentElement.previousElementSibling;
    await screen.findByText('Essay');
    expect(dot('Lab report')).toHaveClass('bg-[#EF4444]');
    expect(dot('Essay')).toHaveClass('bg-border2');
  });
});

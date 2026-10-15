import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderApp } from './renderApp';
import { exam, inDays, task } from './fakeApi';

vi.mock('../lib/supabaseClient', () => import('./fakeSupabase'));

/** Seed a realistic workload so pages render their populated states. */
function seed(api) {
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(2), grade_weight: 30, estimated_hours: 4, course_code: 'STAT 201' }),
    task({ title: 'Lab report', status: 'stuck', due_date: inDays(-1) }),
    task({ title: 'Reading notes', status: 'done', due_date: inDays(-3) }),
  );
  api.db.exams.push(exam({ subject: 'Calculus II', exam_date: inDays(10), topics: ['Series'] }));
  api.db.profile.weekly_schedule = { monday: [{ start: '09:00', end: '11:00', course: 'STAT 201' }] };
}

// Every route renders without reaching the error boundary, with data and empty.
describe.each([
  ['/', /Ama/],
  ['/tasks', 'All Tasks'],
  ['/exams', 'Exam Countdown'],
  ['/chat', 'AI Workload Chat'],
  ['/upload', 'Upload Timetable'],
  ['/focus', "Today's Focus Plan"],
  ['/analytics', 'Advanced Analytics'],
  ['/add', 'Add New'],
  ['/settings', 'Settings'],
])('signed-in route %s', (path, heading) => {
  it.each([
    ['with data', seed],
    ['with no data', undefined],
  ])('renders %s', async (_label, setup) => {
    renderApp(path, { setup });
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument());
  });
});

describe.each([
  ['/landing', /deadline|semester|study/i],
  ['/login', 'Welcome Back'],
  ['/signup', 'Create Account'],
  ['/forgot-password', 'Reset Password'],
  ['/reset-password', 'New Password'],
  ['/no-such-page', /not found|404/i],
])('public route %s', (path, heading) => {
  it('renders when signed out', async () => {
    renderApp(path, { signedIn: false });
    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument();
  });
});

it('sends signed-out visitors from the app to the landing page', async () => {
  renderApp('/tasks', { signedIn: false });
  await waitFor(() => expect(window.location.pathname).toBe('/landing'));
});

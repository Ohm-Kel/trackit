import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { renderApp } from './renderApp';
import { exam, inDays, task } from './fakeApi';

vi.mock('../lib/supabaseClient', () => import('./fakeSupabase'));

function seed(api) {
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(2), grade_weight: 30 }),
    task({ title: 'Reading notes', status: 'done' }),
  );
  api.db.exams.push(exam({ subject: 'Calculus II', exam_date: inDays(10) }));
}

async function violations(container) {
  const result = await axe.run(container, {
    // jsdom cannot compute layout or colours, so contrast is checked in the browser instead.
    rules: { 'color-contrast': { enabled: false } },
  });
  return result.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 3).map((n) => n.html.slice(0, 120)),
  }));
}

describe.each([
  ['/', /Ama/, true],
  ['/tasks', 'All Tasks', true],
  ['/exams', 'Exam Countdown', true],
  ['/chat', 'AI Workload Chat', true],
  ['/upload', 'Upload Timetable', true],
  ['/focus', "Today's Focus Plan", true],
  ['/analytics', 'Advanced Analytics', true],
  ['/add', 'Add New', true],
  ['/settings', 'Settings', true],
  ['/landing', /./, false],
  ['/login', 'Welcome Back', false],
  ['/signup', 'Create Account', false],
  ['/forgot-password', 'Reset Password', false],
])('accessibility of %s', (path, heading, signedIn) => {
  it('has no axe violations', async () => {
    const { container } = renderApp(path, { signedIn, setup: seed });
    await screen.findAllByRole('heading', { level: 1, name: heading });
    expect(await violations(container)).toEqual([]);
  });
});

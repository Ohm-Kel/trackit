import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './renderApp';
import { exam, inDays, task } from './fakeApi';
import { supabase } from './fakeSupabase';

vi.mock('../lib/supabaseClient', () => import('./fakeSupabase'));

let user;
beforeEach(() => {
  user = userEvent.setup();
  vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('signing in and out', () => {
  async function fillLogin(password) {
    await user.type(await screen.findByPlaceholderText('name@example.com'), 'ama@example.edu');
    await user.type(screen.getByPlaceholderText('••••••••'), password);
    await user.click(screen.getByRole('button', { name: /^sign in$/i }));
  }

  it('shows the error for a wrong password and stays on the login page', async () => {
    renderApp('/login', { signedIn: false });
    await fillLogin('wrong');
    expect(await screen.findByText('Invalid login credentials')).toBeInTheDocument();
    expect(window.location.pathname).toBe('/login');
  });

  it('opens the dashboard after signing in, and the landing page after signing out', async () => {
    renderApp('/login', { signedIn: false });
    await fillLogin('correct-horse');
    expect(await screen.findByRole('heading', { level: 1, name: /Ama/ })).toBeInTheDocument();
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'ama@example.edu',
      password: 'correct-horse',
    });

    await user.click(screen.getAllByRole('button', { name: /sign out/i })[0]);
    await waitFor(() => expect(window.location.pathname).toBe('/landing'));
  });
});

describe('adding and editing', () => {
  it('creates a task with numeric fields and shows it in the task list', async () => {
    const { api } = renderApp('/add');
    await user.type(await screen.findByPlaceholderText('e.g. Statistics Assignment 2'), 'Essay draft');
    await user.type(screen.getByPlaceholderText('e.g. STAT 201'), 'HIST 101');
    await user.type(screen.getByPlaceholderText('25'), '20');
    await user.type(screen.getByPlaceholderText('4'), '3.5');
    await user.click(screen.getByRole('button', { name: 'Save Task' }));

    expect(await screen.findByText('Saved successfully!')).toBeInTheDocument();
    const [post] = api.callsTo('POST /tasks');
    expect(post.body).toMatchObject({
      title: 'Essay draft',
      course_code: 'HIST 101',
      grade_weight: 20,
      estimated_hours: 3.5,
      status: 'not_started',
    });
    expect(await screen.findByText('Essay draft', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/tasks');
  });

  it('shows the API’s message when saving fails, and keeps the form', async () => {
    const { api } = renderApp('/add', {
      setup: (fake) =>
        fake.on('POST /tasks', () => fake.json({ error: 'due_date: Invalid date' }, 400)),
    });
    await user.type(await screen.findByPlaceholderText('e.g. Statistics Assignment 2'), 'Essay');
    await user.click(screen.getByRole('button', { name: 'Save Task' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('due_date: Invalid date');
    expect(screen.getByPlaceholderText('e.g. Statistics Assignment 2')).toHaveValue('Essay');
    expect(api.callsTo('POST /tasks')).toHaveLength(1);
  });

  it('does not submit a task without a name', async () => {
    const { api } = renderApp('/add');
    await user.click(await screen.findByRole('button', { name: 'Save Task' }));
    expect(window.alert).toHaveBeenCalledWith('Task name is required');
    expect(api.callsTo('POST /tasks')).toHaveLength(0);
  });

  it('creates an exam with confidence and topics', async () => {
    const { api } = renderApp('/add?tab=exam');
    await user.type(await screen.findByPlaceholderText('e.g. Calculus II'), 'Organic Chemistry');
    await user.click(screen.getByRole('button', { name: /low/i }));
    const topic = screen.getByPlaceholderText('e.g. Integration by parts');
    await user.type(topic, 'Alkenes{Enter}');
    await user.type(topic, 'Chirality{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save & Generate Plan' }));

    await screen.findByText('Saved successfully!');
    expect(api.callsTo('POST /exams')[0].body).toMatchObject({
      subject: 'Organic Chemistry',
      confidence_level: 'low',
      topics: ['Alkenes', 'Chirality'],
    });
  });

  it('pre-fills the form when editing and sends an update', async () => {
    let essayId;
    const { api } = renderApp('/tasks', {
      setup: (fake) => {
        const essay = task({ title: 'Essay', grade_weight: 15, due_date: '2026-11-20T00:00:00.000Z' });
        essayId = essay.id;
        fake.db.tasks.push(essay);
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Edit' }));

    const title = await screen.findByDisplayValue('Essay');
    expect(screen.getByDisplayValue('15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-11-20')).toBeInTheDocument();
    await user.clear(title);
    await user.type(title, 'Essay (final)');
    await user.click(screen.getByRole('button', { name: 'Update Task' }));

    await screen.findByText('Updated successfully!');
    expect(api.callsTo(`PATCH /tasks/${essayId}`)[0].body).toMatchObject({ title: 'Essay (final)' });
  });
});

describe('task list', () => {
  const seed = (fake) =>
    fake.db.tasks.push(
      task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(3) }),
      task({ title: 'Lab report', status: 'not_started', due_date: inDays(-2) }),
    );

  it('marks a task done and moves it to Completed', async () => {
    const { api } = renderApp('/tasks', { setup: seed });
    await user.click(await screen.findByRole('button', { name: 'Mark "Lab report" as done' }));

    expect(await screen.findByRole('button', { name: 'Mark "Lab report" as not done' })).toBeInTheDocument();
    expect(api.callsTo('PATCH /tasks/' + api.db.tasks[1].id)[0].body).toEqual({ status: 'done' });
    expect(screen.getByText(/Completed \(1\)/)).toBeInTheDocument();
  });

  it('filters by search text and by overdue', async () => {
    renderApp('/tasks', { setup: seed });
    const search = await screen.findByPlaceholderText('Search tasks…');
    await user.type(search, 'stat');
    expect(screen.getByText('Statistics assignment')).toBeInTheDocument();
    expect(screen.queryByText('Lab report')).not.toBeInTheDocument();

    await user.clear(search);
    await user.click(screen.getAllByRole('button', { name: /^Overdue/ })[0]);
    expect(await screen.findByText('Lab report')).toBeInTheDocument();
    expect(screen.queryByText('Statistics assignment')).not.toBeInTheDocument();
  });

  it('deletes a task after confirmation', async () => {
    const { api } = renderApp('/tasks', { setup: seed });
    await screen.findByText('Lab report');
    await user.click(screen.getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => expect(api.db.tasks).toHaveLength(1));
    expect(window.confirm).toHaveBeenCalledWith('Delete this task?');
  });

  it('reports a failed update instead of failing silently', async () => {
    renderApp('/tasks', {
      setup: (fake) => {
        seed(fake);
        fake.on(`PATCH /tasks/${fake.db.tasks[0].id}`, () =>
          fake.json({ error: 'Internal server error' }, 500),
        );
      },
    });
    await user.click(await screen.findByRole('button', { name: 'Mark "Statistics assignment" as done' }));
    expect(await screen.findByText("Couldn't update the task")).toBeInTheDocument();
  });
});

describe('timetable upload', () => {
  const pdf = () => new File(['%PDF-1.4 fake'], 'exams.pdf', { type: 'application/pdf' });

  it('parses exams, shows skipped-row warnings, and imports them', async () => {
    const { api, container } = renderApp('/upload', {
      setup: (fake) =>
        fake.on('POST /upload/parse', ({ body }) =>
          fake.json({
            type: body.type,
            data: [
              { subject: 'Calculus II', course_code: 'MATH 201', exam_date: '2026-12-08', exam_time: '09:00' },
              { subject: 'Physics', exam_date: null },
            ],
            warnings: ['1 entry was unreadable and skipped.'],
          }),
        ),
    });
    await screen.findByRole('heading', { level: 1, name: 'Upload Timetable' });
    await user.upload(container.querySelectorAll('input[type="file"]')[0], pdf());

    expect(await screen.findByText('Calculus II (MATH 201)')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 entry was unreadable and skipped.');
    const parse = api.callsTo('POST /upload/parse')[0].body;
    expect(parse).toMatchObject({ mimeType: 'application/pdf', type: 'exam' });
    expect(atob(parse.file)).toBe('%PDF-1.4 fake');

    await user.click(screen.getByRole('button', { name: 'Import 2 Exams' }));
    expect(await screen.findByText(/2 exams imported successfully/)).toBeInTheDocument();
    expect(api.db.exams.map((e) => e.subject)).toEqual(['Calculus II', 'Physics']);
  });

  it('shows the API’s error when parsing fails', async () => {
    const { container } = renderApp('/upload', {
      setup: (fake) =>
        fake.on('POST /upload/parse', () =>
          fake.json({ error: 'The AI service is busy. Please wait a moment and try again.' }, 503),
        ),
    });
    await screen.findByRole('heading', { level: 1, name: 'Upload Timetable' });
    await user.upload(container.querySelectorAll('input[type="file"]')[0], pdf());
    expect(await screen.findByText(/The AI service is busy/)).toBeInTheDocument();
  });

  it('rejects unsupported files before uploading', async () => {
    const { api, container } = renderApp('/upload');
    await screen.findByRole('heading', { level: 1, name: 'Upload Timetable' });
    const input = container.querySelectorAll('input[type="file"]')[0];
    // The picker's accept filter would hide this file; drag-and-drop does not.
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'notes.docx', { type: 'application/msword' })] },
    });
    expect(await screen.findByText(/Unsupported file type/)).toBeInTheDocument();
    expect(api.callsTo('POST /upload/parse')).toHaveLength(0);
  });
});

describe('other pages', () => {
  it('shows tasks completed this week, not the oldest week, on Analytics', async () => {
    renderApp('/analytics', {
      setup: (fake) => fake.db.tasks.push(task({ status: 'done' }), task({ status: 'done' }), task({ status: 'done' })),
    });
    const card = (await screen.findByText('Study Velocity')).closest('div').parentElement;
    expect(within(card).getByText('3')).toBeInTheDocument();
  });

  it('saves profile changes from Settings', async () => {
    const { api } = renderApp('/settings');
    const name = await screen.findByDisplayValue('Ama Owusu');
    await user.clear(name);
    await user.type(name, 'Ama K. Owusu');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    expect(await screen.findByText('Profile updated successfully!')).toBeInTheDocument();
    expect(api.callsTo('PATCH /users/profile')[0].body).toMatchObject({ display_name: 'Ama K. Owusu' });
  });

  it('lists exams with a countdown and removes one after confirmation', async () => {
    const { api } = renderApp('/exams', {
      setup: (fake) => fake.db.exams.push(exam({ subject: 'Calculus II', exam_date: inDays(10) })),
    });
    expect(await screen.findByText('Calculus II')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /remove|delete/i })[0]);
    await waitFor(() => expect(api.db.exams).toHaveLength(0));
  });

  it('sends every API request with the signed-in user’s token', async () => {
    const { api } = renderApp('/', {
      setup: (fake) => fake.db.tasks.push(task({ title: 'Essay', due_date: inDays(1) })),
    });
    await screen.findByRole('heading', { level: 1, name: /Ama/ });
    await waitFor(() => expect(api.calls.length).toBeGreaterThan(2));
    for (const call of api.calls) expect(call.headers.get('authorization')).toBe('Bearer test-jwt');
  });
});

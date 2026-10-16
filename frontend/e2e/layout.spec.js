import { exam, expect, inDays, task, test } from './fakes.js';

// Layout regressions from the UI audit (docs/ui-audit.md). Long, unbroken
// titles are the content most likely to push a page sideways.
const LONG_TITLE = 'Write_the_comprehensive_literature_review_for_the_final_year_dissertation';
const LONG_COURSE = 'BSc Computer Science with Artificial Intelligence and Year in Industry';

const seedLong = (api) => {
  api.db.profile.course = LONG_COURSE;
  api.db.tasks.push(
    task({ title: LONG_TITLE, course_code: 'ENVSCI4010', status: 'in_progress', due_date: inDays(1), estimated_hours: 12, description: LONG_TITLE }),
    task({ title: `${LONG_TITLE} (overdue)`, status: 'not_started', due_date: inDays(-2) }),
  );
  api.db.exams.push(exam({ subject: `${LONG_COURSE} Final Examination`, exam_date: inDays(4), topics: ['Thermodynamics'] }));
  api.db.notifications.push({ id: 'n1', title: 'Due soon', message: `${LONG_TITLE} is due tomorrow`, read_status: false, created_at: new Date().toISOString() });
};

/** Widths by which the page, or the app's scrolling <main>, is wider than its box. */
const horizontalOverflow = (page) =>
  page.evaluate(() =>
    [document.documentElement, document.querySelector('main')]
      .filter(Boolean)
      .map((el) => el.scrollWidth - el.clientWidth)
      .filter((excess) => excess > 0),
  );

const signedIn = ['/', '/tasks', '/exams', '/chat', '/upload', '/focus', '/analytics', '/add', '/settings'];
const signedOut = ['/login', '/signup', '/forgot-password', '/reset-password'];

for (const theme of ['light', 'dark']) {
  for (const path of [...signedIn, ...signedOut]) {
    test(`has no horizontal scroll at 375px in ${theme} mode on ${path}`, async ({ page, api, signIn }) => {
      seedLong(api);
      if (signedIn.includes(path)) await signIn();
      await page.addInitScript((value) => localStorage.setItem('trackit_theme', value), theme);
      await page.setViewportSize({ width: 375, height: 740 });
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      expect(await horizontalOverflow(page)).toEqual([]);
    });
  }
}

test('lays out the task table without overlapping columns at tablet width', async ({ page, api, signIn }) => {
  seedLong(api);
  await signIn();
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto('/tasks');
  const title = page.getByText(LONG_TITLE, { exact: true });
  await expect(title).toBeVisible();
  expect((await title.boundingBox()).width).toBeGreaterThan(100);
  expect(await horizontalOverflow(page)).toEqual([]);
});

test('scrolls a short screen to the end of the sign-up form', async ({ page, api }) => {
  void api;
  await page.setViewportSize({ width: 375, height: 560 });
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  const signInLink = page.getByRole('link', { name: /sign in instead/i });
  // Scroll the way a person does; html and body never scroll in this app.
  await page.mouse.move(180, 300);
  await page.mouse.wheel(0, 2000);
  await expect(signInLink).toBeInViewport();
  await signInLink.click();
  await expect(page).toHaveURL(/\/login$/);
});

test('keeps the notification menu and toasts on a phone screen', async ({ page, api, signIn }) => {
  seedLong(api);
  await signIn();
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/');
  // The deadline reminder for the task due tomorrow.
  const toast = page.getByRole('status').filter({ hasText: 'is due TOMORROW' });
  await expect(toast).toBeVisible();
  await expect(toast).toBeInViewport({ ratio: 1 });

  await page.getByRole('button', { name: 'Open menu' }).click();
  await page.getByRole('button', { name: /^Notifications/ }).click();
  const menu = page.getByRole('heading', { name: 'Notifications' }).locator('xpath=../..');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(375);
});

test('gives phone controls a 44px touch target', async ({ page, api, signIn }) => {
  api.db.tasks.push(task({ title: 'Statistics assignment', due_date: inDays(2) }));
  await signIn();
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/tasks');
  const targets = [
    page.getByRole('button', { name: 'Open menu' }),
    page.getByRole('button', { name: 'Show details' }),
  ];
  for (const target of targets) {
    const box = await target.boundingBox();
    expect(Math.min(box.width, box.height), await target.getAttribute('aria-label')).toBeGreaterThanOrEqual(44);
  }
  // The 17px round checkbox takes taps beyond its edge.
  const checkbox = page.getByRole('button', { name: 'Mark "Statistics assignment" as done' });
  const box = await checkbox.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y - 10);
  await expect(page.getByRole('button', { name: 'Mark "Statistics assignment" as not done' })).toBeVisible();

  await page.getByRole('button', { name: 'Open menu' }).click();
  const close = await page.getByRole('button', { name: 'Close menu' }).boundingBox();
  expect(Math.min(close.width, close.height)).toBeGreaterThanOrEqual(44);
  const navLink = await page.getByRole('link', { name: 'Focus Plan' }).boundingBox();
  expect(navLink.height).toBeGreaterThanOrEqual(44);

  // The Add page's Task/Exam switch sits side by side with full-height halves.
  await page.getByRole('link', { name: 'Add Task / Exam' }).click();
  const taskTab = await page.getByRole('button', { name: /Assignment \/ Task/ }).boundingBox();
  const examTab = await page.getByRole('button', { name: /Exam$/ }).boundingBox();
  expect(Math.abs(taskTab.y - examTab.y)).toBeLessThan(5); // same row, mid fade-in
  expect(examTab.x).toBeGreaterThan(taskTab.x);
  expect(Math.min(taskTab.height, examTab.height)).toBeGreaterThanOrEqual(44);
});

for (const theme of ['light', 'dark']) {
  test(`shows a focus ring on keyboard focus in ${theme} mode`, async ({ page, api, signIn }) => {
    void api;
    await signIn();
    await page.addInitScript((value) => localStorage.setItem('trackit_theme', value), theme);
    await page.goto('/tasks');
    await page.getByPlaceholder('Search tasks…').focus();
    await page.keyboard.press('Tab');
    // Polled: buttons with transition-all animate the ring in.
    await expect
      .poll(() =>
        page.evaluate(() => {
          const style = getComputedStyle(document.activeElement);
          return { style: style.outlineStyle, width: style.outlineWidth, tag: document.activeElement.tagName };
        }),
      )
      .toEqual({ style: 'solid', width: '2px', tag: 'BUTTON' });
  });
}

test('keeps toast text on an opaque surface in dark mode', async ({ page, api, signIn }) => {
  seedLong(api);
  await signIn();
  await page.addInitScript(() => localStorage.setItem('trackit_theme', 'dark'));
  await page.goto('/');
  const toast = page.getByRole('status').filter({ hasText: 'is due TOMORROW' });
  await expect(toast).toBeVisible();
  const background = await toast.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(background).toMatch(/^rgb\(/); // rgba(...) would let the page show through
});

# UI and UX audit

- Date: 2026-10-15
- Scope: every signed-in route (`/`, `/tasks`, `/exams`, `/chat`, `/upload`, `/focus`, `/analytics`, `/add`, `/settings`) and the auth pages (`/login`, `/signup`, `/forgot-password`, `/reset-password`)
- Status: every finding is fixed on `fix/ui-polish`.

## Method

The production build ran with the Playwright fakes in `frontend/e2e/fakes.js`
(fake API and Supabase, the real Content-Security-Policy). A throwaway script
took a screenshot of every route:

- at 375px, 768px and 1280px wide, 800px tall;
- in light and dark mode (`localStorage.trackit_theme`);
- with three data sets: realistic (three tasks, two exams, a notification),
  empty (no data), and long text (task titles of 70 to 90 characters, one
  unbroken 80-character title, a 70-character course name and a long display
  name).

That gives 186 screenshots (the auth pages were taken with the realistic data set only). For each one the script also recorded
`scrollWidth` against `clientWidth` for the document and for `<main>`, and
listed any element past the right edge. html and body never scroll in this
app, because `<main>` is the scroll container, so overflow shows up on
`<main>` rather than the document. Other scripts tabbed through every route in
both themes and recorded each focused element's outline, opened the mobile
menu and the notification menu at 375px and 1280px, and measured tap targets.
Every finding below comes from a screenshot or a measurement. After the fixes
the same run reports no horizontal overflow in any of the 186 combinations
(14 before).

Priorities: **P1** is broken (content you can't reach, read or use), **P2** is
confusing or below an accessibility bar, and **P3** is polish.

## Findings

| # | P | Route | Viewport | Theme | Problem | Status |
|---|---|---|---|---|---|---|
| 1 | P1 | `/login`, `/signup`, `/forgot-password`, `/reset-password` | 375, and any window under about 950px tall | both | The page can't scroll: html and body are `overflow: hidden` and the page used `min-h-screen`. On sign-up the Google button and the "Sign in instead" link are cut off and can't be reached; on a phone, sign-in loses its footer. | Fixed |
| 2 | P1 | `/tasks` | 768 (any width from 768 to 1023) | both | The desktop table starts at `md`, and its fixed columns leave the title column no width. Task titles disappear, and the due badge and course code overlap under a merged "TASK DUE" header. | Fixed |
| 3 | P1 | `/` | 768 with any data; 1280 with a long title | both | The two-column grid (`1fr 290px`) can't shrink below the longest `nowrap` title, so `<main>` scrolls sideways and the Exam Countdown column is cut off: 81px over at 768, 555px at 768 with long titles, 43px at 1280. | Fixed |
| 4 | P1 | `/focus` | 375, 768 and 1280 with long text | both | An unbroken title runs out of the overdue alert, the time-block card and the AI Adjustments card, and the same grid problem pushes the side column off-screen (258px over at 375). | Fixed |
| 5 | P1 | `/` | 375 with a long title | both | The "Start with: …" line in the focus banner runs off the screen. | Fixed |
| 6 | P1 | all signed-in routes | 375 | both | The notification menu opens 280px wide from the bell and ends 43px past the right edge, cutting off "Mark all as read" and the messages. | Fixed |
| 7 | P1 | all signed-in routes | 375 | both | Toasts are `w-full` plus `right-4`, so they start 16px off the left edge, clipping the icon and the first letters. They also cover the mobile menu button. | Fixed |
| 8 | P1 | `/` and every route that shows a toast | all | dark | Toast backgrounds become translucent tints, so a reminder toast's text sits on the page heading behind it and can't be read. Seen only once item 7 put the toast on-screen. | Fixed |
| 9 | P1 | `/analytics` | all | both | "View Focus Plan" has no click handler and does nothing. | Fixed |
| 10 | P2 | `/analytics` | all | both | A failed analytics request is only logged; the page then reports "Burnout risk: Low", "Workload is balanced" and "No danger zones detected" from empty data. There is no error state. | Fixed: error banner with retry; burnout reads "Not available" |
| 11 | P2 | `/analytics` | all | both | With no tasks the recommendation says "You're in a great flow state!". "1 tasks mastered" is ungrammatical. | Fixed |
| 12 | P2 | all text fields (`/tasks` search, `/chat`, `/add`, `/settings`, auth pages) | all | both | `focus:outline-none` leaves keyboard focus as a 1px border tint (and a 5%-opacity ring on the auth pages). Other controls fall back to the browser ring, which is inconsistent and faint in dark mode. | Fixed: one 2px `:focus-visible` ring, lighter in dark mode |
| 13 | P2 | all signed-in routes, `/tasks` | 375 | both | Tap targets under 44px: menu button 40px, close-menu 28px, task row expand 28px, task checkbox 17px, toast close 16px. The root font is 14px, so rem spacing is smaller than it looks. | Fixed |
| 14 | P2 | all signed-in routes | all | dark | The sidebar logo uses `mix-blend-multiply`, which on a dark surface leaves it near-black on black. | Fixed |
| 15 | P2 | `/login`, `/signup` | all | dark | The logo sits in a white box, and the "Or continue with" rules are bright `#F1F5F9` lines. | Fixed |
| 16 | P2 | `/chat` | 768 | both | The context panel takes 256px of a 548px column, so the conversation and input are about 200px wide and wrap every few words. | Fixed: panel from 1024px |
| 17 | P2 | all signed-in routes | all | both | Toasts aren't announced to screen readers (no live region), and the close button has no accessible name. | Fixed |
| 27 | P1 | `/tasks` | 375 | both | The phone row picked its due colour by searching the badge classes for hex fragments the token classes no longer contain, so "Overdue" was never red. | Fixed: `getDueUrgency()` drives every due colour |
| 28 | P2 | `/tasks` | 375 | both | A task without a course code shows a leading "·" before its due date. | Fixed |
| 29 | P2 | `/` | all | both | Every Priority Queue row has a red dot, even when due in ten days. | Fixed: the dot matches the due badge |
| 30 | P2 | all signed-in routes | all | both | The sidebar says "Pro Edition", but there is no paid tier. | Fixed: removed |
| 31 | P2 | all signed-in routes | all | both | The sidebar footer says "Set up profile" whenever the course is empty, even for a named profile. | Fixed |
| 32 | P2 | `/settings` | all | both | The footer reads "Trackit v0.1.0 — BETA · Data Structures Student Edition". | Fixed: the version from package.json, injected at build |
| 33 | P2 | `/analytics` | all | dark | Velocity bars are nearly invisible on the dark card, counts appear only on hover, and the chart has no text alternative. | Fixed |
| 34 | P2 | `/exams` | all | both | The preparation track is invisible at 0%, and "0% prepared … Exam day" reads oddly. | Fixed |
| 18 | P3 | `/add` | 375 | both | The "or fill in manually" rules are fixed 42% widths that run through the label. | Fixed |
| 19 | P3 | `/analytics` | all | both | The header is 28px extra-bold with hard-coded colours and its own padding; every other page uses 20 to 22px bold with the page padding. | Fixed |
| 20 | P3 | `/tasks`, `/exams` | 375 | both | The icon-only Export and Add buttons in the header are 32px tall. | Fixed: 44px on phones |
| 21 | P3 | `/exams` | 375 | both | "Show Revision Subtasks" and "Remove exam" are small text links (about 20px tall). | Fixed: 44px tall |
| 22 | P3 | all signed-in routes | 375 | both | Sidebar links are about 36px tall in the mobile drawer. | Fixed: 44px tall on phones |
| 23 | P3 | `/` | 375 | both | The stat card labels are 10px. | Fixed: 11px, with the icon above the label on phones so words don't split |
| 24 | P3 | `/add` | 375 | both | The Assignment/Exam switch stacks vertically on phones and reads as two list items, not a switch. | Fixed: side by side, 44px tall, with `aria-pressed` |
| 25 | P3 | all signed-in routes | all | light | The logo PNG's background is slightly off-white, so a faint grey square shows in the sidebar. | Fixed: the logo has a transparent background |
| 26 | P3 | `/analytics` | all | both | "Advanced Analytics" and "Mastery Velocity" are marketing copy rather than plain labels. | Fixed: "Analytics" and "Tasks Completed per Week" |
| 35 | P3 | all signed-in routes | 375 vs 768+ | both | The mobile header uses a grid-icon mark while the sidebar uses the raster logo, so branding differs by width. | Fixed: the phone header uses the clock mark from the logo |

Items 27 to 35 came from a second screenshot pass by the coordinating
session (1280px and Pixel 7, light and dark), each verified in the code. It
also asked whether "Ask AI for Better Plan" on `/focus` was a dead control:
it isn't, it opens the chat.

## What changed

| Before | After |
|---|---|
| Sign-up on a 375 × 560 screen ends at the "Create Account" button; the Google button and "Sign in instead" can't be reached. | The page scrolls inside its own container, and the card is centred with auto margins, so it is never clipped at the top. |
| At 768px the task list shows only due badges and course codes under a "TASK DUE" header; the titles have no width. | Below 1024px the task list uses the mobile layout (title, course, due, expand). The table, with a shrinkable title column, starts at 1024px. |
| Dashboard and Focus Plan push their side column off-screen at 768px, or with a long title at any width. | Two columns from 1024px, with `minmax(0, 1fr)` for the main column; `<main>` sets `overflow-wrap: anywhere`, so an unbroken title wraps. `truncate` still truncates. |
| The notification menu ends 43px past the right edge of a phone. | The menu is centred under the bell and capped at `100vw - 24px`. |
| Phone toasts start 16px off the left edge, over the menu button, and in dark mode are see-through. | Toasts sit below the 60px mobile header, inset 16px each side, on an opaque card, are announced with `role="status"`, and have a named 44px close button. |
| Analytics shows "Low risk" when its request fails, and its main button does nothing. | Analytics shows an error with "Try again" and marks the burnout figures unavailable; the button opens the Focus Plan, or Add when there are no tasks. |
| Keyboard focus on fields is a 1px border tint. | Every focusable element shows a 2px accent ring on `:focus-visible` (`#C7D2FE` in dark mode). |
| The dark sidebar logo is near-invisible, and the auth logo is a white box. | In dark mode the logo is inverted (the gold is kept) and blended into the surface. |

## Regression tests

- `frontend/e2e/layout.spec.js` fails if any route in scope has horizontal
  scroll at 375px, on the document or on `<main>`, in light or dark mode,
  with long unbroken titles. It also covers items 1, 2, 6, 7, 8, 12 and 13.
- `frontend/src/test/flows.test.jsx` covers items 9, 10 and 11, and
  `frontend/src/components/Toast.test.jsx` covers item 17.
- The existing axe and dark-mode contrast tests in `frontend/e2e/app.spec.js`
  pass unchanged.

## Not fixed

Nothing. Items 20 and 21 were held back until it was clear the calendar
track does not edit those lines (it adds an item inside the Export menu),
then fixed with the rest.

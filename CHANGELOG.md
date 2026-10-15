# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org).

## [1.2.0] - 2026-10-15

### Added

- Streamed chat replies: `POST /api/chat/stream` sends the reply as server-sent events, and the chat page shows it as it is generated
- Frontend test suite with Vitest and React Testing Library (124 tests, 77% line coverage with a 75% CI threshold): every route renders with and without data, the main flows run against an in-memory fake of the API, and axe checks every page
- End-to-end tests with Playwright: the production build in Chromium at desktop and mobile sizes, including sign-in through supabase-js, a streamed chat reply, CSP enforcement and WCAG 2 AA checks with colour contrast
- Request IDs: every response has `X-Request-Id`, logs include it, and 500 responses return it
- CodeQL security analysis on pull requests, pushes to master and weekly
- `docs/DEPLOYMENT.md` (release, verification and rollback steps), `supabase_migrations_002_rollback.sql` (tested in CI), and ADRs 0004 (streaming) and 0005 (CSP)
- Database CI job: applies the schema and migrations to Postgres 16 and runs Row Level Security checks
- `supabase_migrations_002.sql`
- Content-Security-Policy built from the configured Supabase URL, plus security headers on the frontend (Vercel and Docker)
- Dependency audit in CI for production dependencies, and weekly Dependabot updates

### Changed

- AI rate-limit counters are shared across serverless instances in Postgres, falling back to memory if the database is unavailable (`RATE_LIMIT_STORE`)
- API queries run as the signed-in user, so Row Level Security applies on top of the `user_id` filters (`SUPABASE_ANON_KEY`)
- The onboarding tour starts the first time the user reaches the dashboard, not only when the app opens there
- Library code is split into separately cached chunks; the app entry is 40 KB instead of 480 KB
- The Inter font is self-hosted instead of loaded from Google Fonts
- The timetable parser warns when a long document may have been cut off

### Fixed

- `supabase_schema.sql` failed on a fresh database (`ON table ALL` instead of `FOR ALL`)
- Velocity analytics failed on every request because `tasks.completed_at` did not exist; it is now added and maintained by a trigger
- Notifications and analytics called relative API URLs, which failed in local development
- Task and exam lists failed to load in production: `new URL('/api/tasks')` throws for the relative production API base
- The Analytics "this week" card showed the oldest week's count
- Failed saves, task toggles, deletes and subtask actions gave no feedback; errors now show the API's message
- The upload page ignored the parser's warnings about skipped rows
- The task completion toggle was not reachable by keyboard or screen reader
- Accessibility: buttons without accessible names, form labels not tied to their fields, text below WCAG AA contrast (as low as 2.5:1), and an onboarding tour without dialog semantics or Escape to close
- The focus plan placed study sessions on top of classes when a day had no free window
- The password reset form accepted 6-character passwords, weaker than sign-up's rule
- The chat stream called the model even if the user had already left
- Dark mode kept light-mode tints and dark text, leaving text as low as 1.1:1 contrast; every signed-in page now passes WCAG AA in dark mode, checked in CI
- The completed_at backfill would have overwritten `updated_at` on every done task
- A class starting after 9 PM stretched the focus plan's last window past 9 PM

### Security

- Subtasks can no longer reference another user's task or exam, even through direct Supabase access
- Rate-limit counters are readable and writable by the service role only
- Stored XSS in the PDF export: task and exam text (including text read from uploaded timetables) is now HTML-escaped
- CSV export neutralises spreadsheet formulas (`=`, `+`, `-`, `@`)
- Every API route is rate-limited per user, and failed authentication per IP
- Patched vulnerable dependencies, including proxy-addr (IP spoofing, critical), path-to-regexp, ws, body-parser, qs, react-router and vite
- The browser console no longer logs the user's email and profile metadata
- The timetable prompt tells the model to ignore instructions inside uploaded documents
- No Google Fonts request, so visitor IPs are not sent to a third party

### Upgrade notes

See `docs/DEPLOYMENT.md` for the full checklist.


- Run `supabase_migrations_002.sql` in the Supabase SQL editor
- Add `SUPABASE_ANON_KEY` to the API's environment (on Vercel, Project settings → Environment Variables). Until it is set, the API keeps using the service role and logs a warning

## [1.1.0] - 2026-10-15

### Added

- Evaluation harness for the timetable parser: a versioned synthetic dataset (20 documents, 145 records), scorer, runner, CI self-check and a manual GitHub Actions workflow for real runs
- Interactive API documentation at `/api/docs`, generated from the Zod request schemas
- Per-user rate limits on the chat and timetable-parsing endpoints
- Warnings in the parse response when unreadable rows are skipped
- WebP upload support
- Backend test suite (102 tests, 95% line coverage) and a GitHub Actions CI pipeline
- Docker images and Docker Compose setup; pre-commit hooks
- Architecture decision records, `.env.example` files, contributing guide and MIT licence

### Changed

- Timetable parsing uses forced tool use with a schema generated from Zod instead of free-text JSON
- Chat history sent to the model is capped at the 20 most recent turns
- Structured JSON logging with pino; token usage logged per AI call
- Client upload limits match the API body limit and Claude's image limit

### Fixed

- Chat requests failed because the frontend and backend used different history formats
- Chat history returned the oldest 100 messages instead of the latest 100
- The Settings data backup crashed with an undefined variable
- Creating a task or exam without a date failed
- The edit form spinner never stopped for an unknown task or exam id
- The deployed API function was missing runtime dependencies in the root `package.json`

### Security

- CORS restricted to an allowlist (previously every origin, with credentials)
- Removed the public `/api/debug-env` endpoint
- Error responses no longer include database or upstream messages
- Auth logs no longer include token prefixes
- Subtasks can only be attached to the user's own tasks and exams
- Security headers via helmet; task and note text is isolated in the chat prompt to limit prompt injection

## [1.0.0] - 2026-10-10

- Initial release: tasks, exams, subtasks, AI chat, timetable upload, focus plan, analytics, notifications, export, dark mode and onboarding

[1.2.0]: https://github.com/Ohm-Kel/trackit/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/Ohm-Kel/trackit/compare/5b4e017...v1.1.0
[1.0.0]: https://github.com/Ohm-Kel/trackit/tree/5b4e017

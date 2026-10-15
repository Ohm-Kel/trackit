# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org).

## [1.2.0] - 2026-10-15

### Added

- Streamed chat replies: `POST /api/chat/stream` sends the reply as server-sent events, and the chat page shows it as it is generated
- Frontend test suite with Vitest and React Testing Library (30 tests), run in CI with a coverage summary
- Database CI job: applies the schema and migrations to Postgres 16 and runs Row Level Security checks
- `supabase_migrations_002.sql`

### Changed

- AI rate-limit counters are shared across serverless instances in Postgres, falling back to memory if the database is unavailable (`RATE_LIMIT_STORE`)
- API queries run as the signed-in user, so Row Level Security applies on top of the `user_id` filters (`SUPABASE_ANON_KEY`)
- The onboarding tour starts the first time the user reaches the dashboard, not only when the app opens there

### Fixed

- `supabase_schema.sql` failed on a fresh database (`ON table ALL` instead of `FOR ALL`)

### Security

- Subtasks can no longer reference another user's task or exam, even through direct Supabase access
- Rate-limit counters are readable and writable by the service role only

### Upgrade notes

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

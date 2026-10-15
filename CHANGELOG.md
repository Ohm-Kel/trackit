# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org).

## [1.1.0] - Unreleased

### Added

- Evaluation harness for the timetable parser: a versioned synthetic dataset (20 documents, 145 records), scorer, runner and CI self-check
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

# ADR 0006: Run the API's tests against a real Supabase stack

- Status: Accepted
- Date: 2026-10-15

## Context

The backend's Jest suite replaces Supabase with a fake
(`backend/tests/helpers/supabaseMock.js`) that records each query and returns
queued results. It is fast and checks that every query filters by
`req.user.id`, but it cannot tell whether a query would work. The velocity
endpoint selected `tasks.completed_at`, a column that did not exist, and every
test passed until a manual review found it.

`scripts/db/rls-test.sql` checks the schema, the migrations and the Row Level
Security policies on plain Postgres, but it runs hand-written SQL. Nothing ran
the API's own supabase-js calls (filters, selects, upserts and RPC calls)
through PostgREST, with tokens issued by GoTrue.

## Decision

Add a second Jest suite, `backend/tests/db`, that runs the unmodified Express
app (`createApp()`) against a local Supabase stack:

- **The stack comes from the official Supabase CLI** (`supabase start`), using
  `supabase/config.toml`. Only Postgres, PostgREST, GoTrue and the Kong gateway
  are started; Studio, Realtime, Storage, the edge runtime, analytics and the
  mail server are turned off.
- **The migrations are the files production uses.** `supabase/migrations`
  holds symlinks to `supabase_schema.sql`, `supabase_migrations.sql` and
  `supabase_migrations_002.sql`, in the order `docs/DEPLOYMENT.md` gives, so
  there is no second copy to drift.
- **Real users and tokens.** Each test file creates confirmed users with the
  GoTrue admin API, signs them in with a password to get access tokens, and
  calls the API with them through supertest. `SUPABASE_URL`,
  `SUPABASE_SERVICE_KEY` and `SUPABASE_ANON_KEY` point at the local stack, so
  token checks, RLS and the rate-limit RPC all run for real. Only Anthropic is
  mocked. Users are deleted afterwards, and their rows go with them.
- **Coverage.** Every route's database path, the `completed_at` trigger, the
  shared rate-limit counters across two app instances built from separate
  module registries, and cross-user isolation both through every endpoint and
  through PostgREST directly with another user's token.
- **Safety.** The suite refuses to run unless `SUPABASE_URL` is a local
  address, and waits for GoTrue and PostgREST to answer before starting, so it
  never relies on fixed sleeps.
- **One command.** `scripts/db/integration.sh` starts the stack if needed and
  runs `npm run test:db`. CI runs the same script in the `database-api` job.
  The fast mocked suite (`npm test`) ignores `tests/db` and is unchanged.

## Alternatives considered

- **Compose Postgres, PostgREST and GoTrue containers ourselves** with a
  shared JWT secret. It would pull fewer and smaller images, but we would have
  to recreate what the Supabase Postgres image provides (the `anon`,
  `authenticated`, `service_role` and `authenticator` roles, the `auth` and
  `extensions` schemas, default grants), route `/rest/v1` and `/auth/v1` the
  way supabase-js expects, and keep image versions in step with the hosted
  platform by hand. Drift from production is the failure this suite exists to
  catch, so the official CLI is worth its extra start-up time.
- **Point the tests at a hosted Supabase project.** Rejected: it needs secrets
  in CI, cannot run for pull requests from forks, and risks touching real data.
- **Extend `rls-test.sql`.** It stays as a fast check of the SQL itself, but it
  cannot exercise supabase-js or PostgREST.

## Consequences

- Bugs the fake cannot show now fail CI. The first run found two: malformed
  ids returned 500 instead of 404, and chat history could return a reply
  before its question, because both turns share a `created_at`.
- The CI job pulls the Supabase images (about 1 GB), most of its run time; the
  tests themselves take about 5 seconds.
- Running the suite locally needs Docker. The stack is left running between
  runs; `RESET_DB=1 scripts/db/integration.sh` re-applies the migrations after
  editing the SQL files, and `supabase stop` shuts it down.
- `supabase/config.toml` pins Postgres 17. It should match the hosted
  project's major version (`SHOW server_version;`).
- Symlinked migrations need a checkout that keeps symlinks (the default on
  Linux and macOS; on Windows, enable `core.symlinks`).

# ADR 0003: The API is the authorisation boundary for server-side queries

- Status: Accepted
- Date: 2026-10-15

## Context

Supabase tables have Row Level Security (RLS) policies that limit each user
to their own rows. The browser uses the public anon key, so RLS protects
direct client access such as the Realtime notifications subscription.

The Express API, however, uses the service role key, which bypasses RLS. It
does this so it can verify tokens and run multi-table logic (for example,
building the chat context) in one place.

## Decision

Treat the API as the authorisation boundary for everything it does:

- `authMiddleware` verifies the Supabase access token on every route except
  `/health` and the API docs.
- Every query filters by `req.user.id`, including when checking that a
  subtask's parent task or exam belongs to the user.
- Request bodies are validated with Zod, which strips unknown fields, so a
  client cannot set `user_id` or other protected columns.
- Integration tests use a Supabase fake that records each query and assert
  the `user_id` filter is present.

## Consequences

- A missing filter would be a data leak, so the tests check scoping
  explicitly; removing the filter from a handler makes the suite fail.
- RLS remains a second layer for any client-side access.
- Alternative considered: forward the user's JWT to Supabase so RLS applies
  to API queries too. Adopted in v1.2.0; see the amendment below.

## Amendment (v1.2.0): RLS also applies to API queries

`authMiddleware` now attaches `req.db`, a Supabase client created per request
with the anon key and the user's access token. Handlers query through it, so
Postgres applies RLS to every API query as well as the explicit `user_id`
filters. The service role is kept only for verifying tokens and for the
rate-limit counters.

- The profile auto-repair path did not need the service role after all: the
  `users` table already allows a user to insert their own row.
- Running as the user exposed two policy gaps, fixed in
  `supabase_migrations_002.sql`: notifications had no INSERT policy, and a
  subtask could reference another user's task or exam (now blocked by a
  restrictive policy).
- `scripts/db/rls-test.sql` runs in CI against Postgres 16 and checks each
  operation the API performs, plus cross-user reads and writes that must fail.
- A unit test fails if a controller imports the service-role client.
- Without `SUPABASE_ANON_KEY` the API falls back to the service role and logs a
  warning, so existing deployments keep working until the key is added.
- Cost: one extra client object per request. Creating it makes no network
  call.

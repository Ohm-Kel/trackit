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
  to API queries too. This is stronger defence in depth and is on the
  roadmap; it needs a per-request Supabase client and a review of the
  profile auto-repair path, which currently relies on the service role.

# ADR 0002: Per-user rate limits on AI endpoints

- Status: Accepted
- Date: 2026-10-15

## Context

`POST /api/chat` and `POST /api/upload/parse` call the Anthropic API on the
project's key. Any signed-in user could call them without limit, so one
script or one bug in the client could run up the bill. Chat requests also
sent the full conversation history, so cost grew with every message.

## Decision

- Apply `express-rate-limit` after authentication, keyed by user id rather
  than IP, because students on a campus network often share one IP. Defaults:
  30 chat messages and 10 parses per user per hour, configurable through
  environment variables.
- Cap the history sent to the model at the most recent 20 turns and the
  message length at 4,000 characters.
- Keep the counters in Postgres (amended in v1.2.0, see below).

## Consequences

- Token usage per request is logged, so actual spend per user can be
  monitored before tightening limits.

## Amendment (v1.2.0): shared counters in Postgres

The first version used the library's in-memory store. On Vercel each
serverless instance kept its own counter, so the effective limit was "per user
per warm instance".

Counters now live in a `rate_limits` table, updated by a `rate_limit_hit`
function that increments with a single upsert, so concurrent requests from
different instances cannot lose a hit. A Redis service such as Upstash was the
alternative; Postgres was chosen because the project already depends on it,
and at two AI calls per request the extra database round trip is negligible.

- The table has RLS enabled with no policies, and execute rights on the
  functions are revoked from `anon` and `authenticated`, so only the service
  role can touch counters.
- If the database call fails (for example, before `supabase_migrations_002.sql`
  has been run), the store counts in memory and logs once. Limits degrade to the
  old per-instance behaviour instead of switching off.
- `RATE_LIMIT_STORE=memory` keeps the in-memory store, which tests and
  single-process setups use.

## Amendment (v1.2.0): limits beyond the AI endpoints

- Every authenticated route also has a per-user limit (default 300 requests
  a minute) as a backstop against runaway clients. It uses the in-memory store:
  it protects the database rather than a paid API, and a shared counter would
  add a database round trip to every request.
- Failed authentication is limited per IP (default 50 per 15 minutes), because
  each bad token costs a Supabase Auth call. Only 401 responses count, so
  students sharing a campus IP are not affected by each other's normal use.

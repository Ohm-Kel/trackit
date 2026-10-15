# ADR 0002: Per-user, in-memory rate limits on AI endpoints

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
- Use the library's default in-memory store.

## Consequences

- On Vercel, each serverless instance keeps its own counter, so the effective
  limit is "per user per warm instance". This bounds runaway loops and casual
  abuse, which is the main risk at the current scale, without adding
  infrastructure.
- A shared store (for example Upstash Redis) would make the limit exact
  across instances. It is a drop-in change to `middleware/rateLimit.js` and
  is listed on the roadmap.
- Token usage per request is logged, so actual spend per user can be
  monitored before tightening limits.

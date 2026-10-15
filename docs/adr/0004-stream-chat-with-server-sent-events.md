# ADR 0004: Stream chat replies with server-sent events

- Status: Accepted
- Date: 2026-10-15

## Context

A chat reply took several seconds to appear in full, with only a spinner in
the meantime. Claude can stream its reply as it is generated.

## Decision

- Add `POST /api/chat/stream`, which takes the same body as `POST /api/chat`
  and responds with server-sent events: `delta` events carrying text
  fragments, then `done` with the complete reply once it is saved, or
  `error` with a client-safe message.
- Use SSE over a `fetch` response body rather than WebSockets. It works over
  plain HTTP on Vercel functions and nginx, needs no extra server, and the
  frontend parses it in about forty lines (`frontend/src/api/sse.js`).
- Send headers only with the first text fragment, so validation, rate-limit
  and early upstream errors stay ordinary JSON error responses.
- Abort the model stream when the client disconnects, and skip the model
  call entirely if the client left while the workload was loading.
- Keep `POST /api/chat` for API clients that want a single JSON reply.

## Consequences

- A reply interrupted mid-stream is not saved, and the frontend keeps it out
  of the history it sends next time, so the model never sees a reply the
  database lacks.
- `X-Accel-Buffering: no` and `Cache-Control: no-transform` stop proxies
  buffering the stream.
- Tests cover the event sequence, errors before and during the stream, and
  disconnects, using a fake of the SDK stream; a check against the real SDK
  with a local SSE server confirmed the event shapes.

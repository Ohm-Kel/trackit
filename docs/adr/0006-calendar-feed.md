# ADR 0006: Calendar subscription through a secret, hashed feed URL

- Status: Accepted
- Date: 2026-10-15

## Context

Students want their deadlines and exams in the calendar they already use,
updating by themselves. Google Calendar, Apple Calendar and Outlook all
support subscribing to an iCalendar (RFC 5545) URL, which they fetch
periodically. They cannot send an `Authorization` header or sign in, so the
usual bearer-token check (ADR 0003) cannot protect the feed.

## Decision

### A secret URL per user

- The feed is `GET /api/calendar/<token>.ics`. The token is 32 bytes from the
  operating system's CSPRNG, base64url-encoded (43 characters, 256 bits). The
  `.ics` suffix helps calendar apps recognise the format.
- Each user has at most one token. Creating a link again replaces it
  (rotation), and revoking deletes it. Both are signed-in API calls
  (`POST`/`DELETE /api/calendar/feed`).
- The token is returned once, when created. The settings page shows it then
  and explains that it cannot be shown again, as GitHub does for access
  tokens.

### Store only a SHA-256 hash

- `calendar_feeds` (migration 003) stores `sha256(token)`, never the token.
  A database leak or a policy mistake reveals hashes, which cannot be turned
  back into working URLs.
- A plain, unsalted SHA-256 is enough because the token is random with 256
  bits of entropy: there is no dictionary to try and brute force is
  infeasible. A salted slow hash (bcrypt, Argon2) would protect low-entropy
  passwords, but would prevent the indexed equality lookup the feed needs.

### Look the token up without the service role

- RLS limits users to their own `calendar_feeds` row, and the API manages it
  as the signed-in user through `req.db`.
- The feed request has no user session, so RLS cannot select the owner's
  tasks. Instead of using the service role, the API calls
  `public.calendar_feed(token)` with the anon key. This `SECURITY DEFINER`
  function hashes the token in Postgres, finds the owner, and returns only
  what the feed shows: open tasks with a due date and exams with a date. It
  is executable by `anon` (and `service_role`, the fallback when
  `SUPABASE_ANON_KEY` is unset), not by signed-in users, and has an empty
  `search_path`.
- Because the function hashes the raw token itself, the stored hash is not a
  usable credential either. `scripts/db/rls-test.sql` checks this, along
  with cross-user access, rotation and revocation.
- The function is reachable directly through PostgREST with the public anon
  key. That gives an attacker nothing the API endpoint does not: both need
  the 256-bit token.

### Generate iCalendar ourselves

- `backend/lib/ical.js` is a small writer (about 130 lines) instead of a
  library such as `ical-generator`. Trackit needs one shape of calendar, and
  a writer this size is easy to verify: CRLF line endings, folding at 75
  octets without splitting a UTF-8 character, and TEXT escaping of `\`, `;`,
  `,` and line breaks, with other control characters dropped. Titles are
  untrusted (they can come from an uploaded timetable). Tests parse the
  output with Mozilla's `ical.js` (a dev dependency) and check hostile
  titles, such as one containing `\nBEGIN:VEVENT`, round-trip as text.
- It adds no runtime dependency to the serverless bundle, and the output is
  deterministic (see caching).

### Event model

- The app's forms store dates only, which Postgres keeps as midnight UTC. A
  midnight-UTC value becomes an all-day event (`DTSTART;VALUE=DATE`, `DTEND`
  the next day). Any other time becomes a timed UTC event without `DTEND`,
  because Trackit does not know an exam's length.
- Open tasks appear as all-day events on their due date, marked
  `TRANSP:TRANSPARENT` so a deadline does not block the day in free/busy
  views. Done tasks are left out, so they disappear on the next refresh.
  Exams appear as events. Undated items are left out.
- UIDs are `trackit-task-<uuid>` and `trackit-exam-<uuid>`, from random row
  ids (RFC 7986 §5.3), so editing an item updates the event rather than
  duplicating it. `DTSTAMP` is the row's `updated_at`.

### Caching and abuse

- The feed is sent with `Cache-Control: private, max-age=300`: never stored
  by a shared cache or CDN, and a revoked link stops being served within
  five minutes. Because the body depends only on the data, Express's ETag
  lets an unchanged refresh return `304 Not Modified`. The calendar also
  suggests hourly refreshes (`REFRESH-INTERVAL`, `X-PUBLISHED-TTL`); Google
  Calendar ignores this and polls on its own schedule, typically every few
  hours.
- Google, Microsoft and Apple fetch every subscriber's feed from a small
  pool of shared IPs, and keep polling links that were rotated or revoked.
  So an unknown token returns 404 **without** counting as a failed
  authentication: counting it would let stale subscriptions block a
  fetcher IP through the app-wide failed-auth limit, and break calendar
  sync for every user on it. Nothing is lost, because guessing a 256-bit
  token is infeasible.
- A **malformed** token (anything but 43 base64url characters) still
  counts as a failed authentication for the IP
  (`backend/lib/authFailures.js`). Real calendar clients only hold
  well-formed tokens, so this only catches scanners. A database error is
  not counted.
- The feed route has its own per-IP limit (600 requests a minute per
  instance, `CALENDAR_FEED_RATE_LIMIT`), separate from the failed-auth
  counter, so reaching it never blocks other routes. It only stops a
  client hammering the database; it is high because one fetcher IP serves
  many users.
- Feed tokens are replaced with `[token]` in request and error logs.
- `POST /api/calendar/feed` falls under the general per-user API limit.

## Consequences

- Anyone with the link can read the user's task titles, descriptions and
  exam dates. The settings page says so, and rotating or revoking cuts off
  an exposed link. Revoking stops updates; events already copied into a
  calendar remain until the user removes the subscription.
- The URL appears in the hosting platform's access logs (Vercel), which the
  API cannot redact. Putting the token in a query string would not avoid
  this.
- A regression test sends many unknown-token requests from one IP and
  checks that the same IP still gets a valid feed and signed-in API
  responses. If the feed limit is ever reached by a busy fetcher IP,
  raise `CALENDAR_FEED_RATE_LIMIT`; old subscriptions could also be
  answered with `410 Gone` from kept tombstones, so clients stop polling.
- Date-only due dates rely on Postgres storing them at midnight UTC, which
  holds for Supabase's default UTC time zone.
- Alternatives considered: pushing events to each provider's API (needs
  OAuth and a sync job per provider); CalDAV (far more surface than a
  read-only feed); storing the token encrypted so it could be shown again
  (needs key management, and a leaked key would expose every link).

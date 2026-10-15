# ADR 0005: Content-Security-Policy built from the Supabase URL

- Status: Accepted
- Date: 2026-10-15

## Context

The frontend had no Content-Security-Policy. A stored XSS in the PDF export
(fixed in v1.2.0) showed the cost: injected script runs with access to the
Supabase session in `localStorage`. A CSP limits what injected script can
load or send.

## Decision

- Generate the policy at build time (`vite.config.js`) as a `<meta>` tag
  naming the exact Supabase origin from `VITE_SUPABASE_URL`. A static header
  would have to allow every `*.supabase.co` host and would break a custom
  Supabase domain.
- `script-src 'self'`, and `connect-src` limited to this origin and the
  Supabase project (HTTPS and its Realtime WebSocket).
- Allow `'unsafe-inline'` for styles only, because React inline `style`
  attributes need it. Script stays strict.
- Send what a `<meta>` policy cannot carry (`frame-ancestors`) as a header,
  with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy` and HSTS, from `vercel.json` and `frontend/nginx.conf`.
  `/api` is excluded because the API sets its own headers.
- Self-host the Inter font instead of loading it from Google Fonts, removing
  the third-party request (and the visitor IP it sends) and the CSP
  exceptions it needed.
- Fail the build when `VITE_SUPABASE_URL` is missing, rather than ship a
  policy that blocks the app.

## Consequences

- The Playwright suite runs the production build with this policy and fails
  on any CSP violation, so a new third-party script or API host must be
  added to the policy deliberately.
- Adding an external service (analytics, error reporting) requires a policy
  change in `vite.config.js`.

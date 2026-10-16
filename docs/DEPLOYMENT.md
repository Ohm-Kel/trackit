# Deployment

How to release Trackit to production on Vercel and Supabase, and how to roll
back. Steps marked **once** only apply when upgrading to v1.2.0.

## Before you deploy

1. CI is green on the commit: backend, frontend, end-to-end, database and
   Docker jobs. GitGuardian has no open incidents.
2. The changelog has an entry for the release.

## 1. Database (Supabase SQL editor)

Run migrations before deploying the code that needs them. They are additive
and re-runnable.

| Order | File | When |
|---|---|---|
| 1 | `supabase_schema.sql` | New project only |
| 2 | `supabase_migrations.sql` | New project only |
| 3 | `supabase_migrations_002.sql` | **once**, upgrading to v1.2.0 |
| 4 | `supabase_migrations_003.sql` | **once**, before deploying the calendar feed |

Migration 002 adds the shared rate-limit counters, `tasks.completed_at`, and
two Row Level Security policies. Migration 003 adds `calendar_feeds` (hashed
feed tokens) and the `calendar_feed` lookup function. Without it, Settings →
Calendar shows an error and feed URLs return 500; the rest of the app is
unaffected. Every migration is tested in CI against Postgres 16
(`scripts/db/test.sh`), including its rollback.

## 2. Supabase Auth settings

In Authentication → Providers → Email (and Sign In / Providers settings):

- **Password requirements**: minimum length 8, require digits and symbols.
  This matches `frontend/src/utils/password.js`; the client check alone can
  be bypassed by calling Supabase directly.
- **Leaked password protection** (Pro plan): on. It rejects passwords found
  in known breaches.
- **Confirm email**: on.

In Authentication → URL Configuration:

- **Site URL**: the production URL.
- **Redirect URLs**: the production URL and `https://*-<team>.vercel.app/**`
  for previews, so password-reset and Google sign-in links return to the app.

## 3. Vercel environment variables

Set for **Production** and **Preview** (Project settings → Environment
Variables). A change applies to the next deployment.

| Variable | Notes |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | API only; never prefix with `VITE_` |
| `SUPABASE_ANON_KEY` | **once** for v1.2.0: lets API queries run as the user, so RLS applies |
| `ANTHROPIC_API_KEY` | API only |
| `ALLOWED_ORIGINS` | Only needed for a frontend on another origin |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Frontend; the build fails without the URL, because the Content-Security-Policy is generated from it |

Optional tuning variables are listed in `backend/.env.example`.

## 4. Deploy

Merging to `master` deploys to production. Every pull request gets a
preview deployment first: sign in on the preview and check the dashboard,
task list and chat before merging.

## 5. Verify production

- `GET /api/health` returns `{"status":"ok"}`.
- Sign in, open Tasks, Exams and Analytics, and send one chat message.
- In the browser's developer tools, the page has a `Content-Security-Policy`
  `<meta>` tag and no CSP errors in the console.
- In Settings → Calendar, create a link and open it in a browser: it
  downloads a `.ics` file. Then revoke it.
- In Vercel → Logs, look for `Shared rate-limit store unavailable` (means
  migration 002 is missing) or `SUPABASE_ANON_KEY is not set`.

## Rolling back

- **Code**: in Vercel → Deployments, promote the previous production
  deployment. This is instant and needs no rebuild.
- **Database**: only if the code rollback goes to a version before v1.2.0
  and you need the schema to match. Roll back the code first, then run
  `supabase_migrations_002_rollback.sql`. It discards rate-limit counters
  and task completion times. v1.1.0 does not need the rollback to run; the
  added objects are unused by it.

To roll back the calendar feed, roll back the code first, then run
`supabase_migrations_003_rollback.sql`. Every subscription link stops working.

Every 500 response includes a `requestId` that matches the `requestId`
field in the API logs, which helps trace a user's report.

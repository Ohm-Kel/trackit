# Contributing to Trackit

## Workflow

1. Branch off `master` using `feat/<name>`, `fix/<name>`, `docs/<name>` or `chore/<name>`. Never commit directly to `master`.
2. Keep each commit to one logical change.
3. Open a pull request. CI must pass and another person must review it before merging.

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org):

```
<type>(<scope>): <imperative summary under 72 characters>

Why the change was needed, when that is not obvious.
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`. Mark breaking changes with `!` or a `BREAKING CHANGE:` footer.

## Pull requests

Describe what changed, why, and how it was tested. Include sample output or screenshots for user-facing changes, and link the related issue.

## Local checks

Install the hooks once so the CI checks run on every commit:

```bash
pip install pre-commit && pre-commit install
```

Or run them by hand:

```bash
cd backend
npm run lint && npm run format:check && npm test
npm run eval -- --oracle
cd ../frontend
npm run lint && npm test && npm run build
cd ..
DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/db/test.sh  # empty database
scripts/db/integration.sh  # the API against a real local Supabase stack (needs Docker)
```

`scripts/db/integration.sh` starts Postgres, PostgREST and GoTrue with the
Supabase CLI (installed on demand through `npx`), applies the SQL files as
migrations, and runs `backend/tests/db` with real users and tokens. The stack
stays up between runs: pass Jest arguments to run one file
(`scripts/db/integration.sh isolation`), use `RESET_DB=1` after editing the
SQL files, and `npx supabase@2.121.0 stop` when done. See
[ADR 0008](docs/adr/0008-real-database-integration-tests.md).

## Code conventions

- Validate every request body with a Zod schema exported from its controller; the OpenAPI document is generated from these schemas.
- Query the database through `req.db`, which acts as the signed-in user so Row Level Security applies, and still filter every query by `req.user.id` (see [ADR 0003](docs/adr/0003-api-as-authorization-boundary.md)). Add a test that asserts the filter. Never import the service-role client into a controller.
- A new table or a new kind of write needs an RLS policy, and a check in `scripts/db/rls-test.sql`.
- A new route or query needs a test in `backend/tests/db` that runs it against the real stack, including a check that another user cannot reach the rows. Name a new migration `supabase_migrations_NNN.sql`; `scripts/db/integration.sh` links it into `supabase/migrations` (or run `scripts/db/sync-migrations.sh`), and CI fails until the link is committed.
- Throw `HttpError` for client-facing errors. Let anything else reach the central error handler, which logs it and returns a generic message.
- Log with the shared pino logger, never `console`.
- Runtime dependencies added to `backend/package.json` must also be added to the root `package.json`, which Vercel uses for the API function. `npm run check:deps` enforces this.
- Changes to the timetable parser's prompt, schema or model should include a before-and-after `npm run eval` result in the PR.
- Record significant design decisions as ADRs in `docs/adr/`.

## Releases

Releases are tagged with semantic versioning (`v1.1.0`) and summarised in [CHANGELOG.md](CHANGELOG.md).

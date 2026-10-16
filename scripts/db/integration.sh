#!/usr/bin/env bash
# Run the API's real-database tests (backend/tests/db) against a local
# Supabase stack: Postgres, PostgREST and GoTrue, with the repository's SQL
# files applied as migrations. Starts the stack if it is not running, and
# leaves it running for the next run (stop it with `supabase stop`).
# Needs Docker. Extra arguments go to Jest, e.g. scripts/db/integration.sh isolation
set -euo pipefail
cd "$(dirname "$0")/../.."

# Keep in step with backend/tests/db/stack.js and the CI workflow.
SUPABASE_CLI_VERSION=2.121.0
if command -v supabase >/dev/null 2>&1; then
  supabase() { command supabase "$@"; }
else
  supabase() { npx --yes "supabase@${SUPABASE_CLI_VERSION}" "$@"; }
fi

# Only what the API uses; the rest of the local stack is not started.
EXCLUDE=vector,logflare,imgproxy,postgres-meta,supavisor,mailpit,studio,realtime,storage-api,edge-runtime

# Pick up every root migration file (supabase_migrations_NNN.sql) in order.
linked=$(scripts/db/sync-migrations.sh)
[ -n "$linked" ] && echo "$linked"

if ! supabase status >/dev/null 2>&1; then
  supabase start -x "$EXCLUDE"
elif [ -n "$linked" ] || [ "${RESET_DB:-0}" = 1 ]; then
  # Re-apply the migrations to an empty database when the set changed, or
  # after editing the SQL files.
  supabase db reset
fi

eval "$(supabase status -o env | sed -n \
  -e 's/^API_URL=/export SUPABASE_URL=/p' \
  -e 's/^SERVICE_ROLE_KEY=/export SUPABASE_SERVICE_KEY=/p' \
  -e 's/^ANON_KEY=/export SUPABASE_ANON_KEY=/p')"

cd backend
npm run test:db -- "$@"

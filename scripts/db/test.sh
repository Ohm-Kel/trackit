#!/usr/bin/env bash
# Apply the schema and every migration to an empty Postgres database, check
# that migration 002 re-runs and rolls back cleanly, then run the RLS checks.
# Usage: DATABASE_URL=postgres://postgres@localhost:5432/postgres scripts/db/test.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
psql_run() { psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q "$@"; }

psql_run -f scripts/db/supabase-stub.sql
psql_run -f supabase_schema.sql
psql_run -f supabase_migrations.sql
psql_run -f supabase_migrations_002.sql
psql_run -f supabase_migrations_002.sql
psql_run -f supabase_migrations_002_rollback.sql
psql_run -f supabase_migrations_002_rollback.sql
psql_run -f supabase_migrations_002.sql
psql_run -f scripts/db/rls-test.sql

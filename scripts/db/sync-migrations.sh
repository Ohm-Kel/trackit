#!/usr/bin/env bash
# Link each SQL migration at the repository root into supabase/migrations, in
# the order docs/DEPLOYMENT.md applies them: supabase_schema.sql,
# supabase_migrations.sql, then supabase_migrations_NNN.sql by number.
# Rollback scripts are skipped. Prints each link it adds or removes.
# With --check, change nothing and fail if a link is missing or stale (CI).
set -euo pipefail
cd "$(dirname "$0")/../.."

check=0
[ "${1:-}" = --check ] && check=1
dir=supabase/migrations

# Parallel lists of link names and their targets (no associative arrays, so
# this runs on the bash 3.2 that macOS ships).
names=()
targets=()
# The CLI applies files in name order, so the position becomes the version.
add() {
  names+=("$((20260101000000 + $2))_$3.sql")
  targets+=("../../$1")
}

add supabase_schema.sql 0 schema
add supabase_migrations.sql 1 migrations
for file in supabase_migrations_*.sql; do
  [ -e "$file" ] || continue
  case "$file" in *_rollback.sql) continue ;; esac
  number=${file#supabase_migrations_}
  number=${number%.sql}
  if ! [[ $number =~ ^[0-9]+$ ]] || ((10#$number < 2)); then
    echo "Unexpected migration file name: $file (use supabase_migrations_NNN.sql, from 002)" >&2
    exit 1
  fi
  add "$file" $((10#$number)) "migrations_$number"
done

problems=0
for i in "${!names[@]}"; do
  name=${names[$i]}
  target=${targets[$i]}
  [ "$(readlink "$dir/$name" 2>/dev/null)" = "$target" ] && continue
  if ((check)); then
    echo "Missing link: $dir/$name -> $target" >&2
    problems=1
  else
    ln -sfn "$target" "$dir/$name"
    echo "Linked $dir/$name -> $target"
  fi
done

for link in "$dir"/*.sql; do
  [ -e "$link" ] || [ -L "$link" ] || continue
  case " ${names[*]} " in *" $(basename "$link") "*) continue ;; esac
  if ((check)) || [ ! -L "$link" ]; then
    # Never delete a real file: migrations belong at the repository root.
    echo "Stale migration: $link (not one of the root SQL files)" >&2
    problems=1
  else
    rm "$link"
    echo "Removed $link"
  fi
done

if ((problems)); then
  echo "Run scripts/db/sync-migrations.sh and commit supabase/migrations." >&2
  exit 1
fi

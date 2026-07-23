#!/bin/sh
set -e

# All MySQL migration scripts that must run for the schema to be complete.
# Add new ones here — this list is the single source of truth for "what
# migrations apply to MySQL," instead of duplicating table SQL across files.
MYSQL_MIGRATIONS="
src/lib/db/migrate-mysql-init.ts
src/lib/db/migrate-review-workflow-mysql.ts
src/lib/db/migrate-users-mysql.ts
"

run_mysql_migrations() {
  for script in $MYSQL_MIGRATIONS; do
    echo "→ $script"
    node_modules/.bin/tsx "$script"
  done
}

# Run DB migrations if DATABASE_URL points to MySQL
if echo "$DATABASE_URL" | grep -qE "^mysql2?://"; then
  echo "Running MySQL migrations..."

  # On a freshly created MySQL container/volume, the healthcheck (internal
  # socket ping) can pass before mysqld actually accepts TCP connections from
  # other containers — a known two-phase-startup race in the official mysql
  # image. Retry the whole (idempotent) sequence instead of failing the
  # container on that transient window.
  attempt=1
  max_attempts=15
  until run_mysql_migrations; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Migrations failed after $attempt attempts, giving up."
      exit 1
    fi
    echo "Migration attempt $attempt failed, retrying in 3s..."
    attempt=$((attempt + 1))
    sleep 3
  done

  echo "Migrations complete."
fi

exec node server.js

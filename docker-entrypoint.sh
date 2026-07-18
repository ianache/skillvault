#!/bin/sh
set -e

# Run DB migrations if DATABASE_URL points to MySQL
if echo "$DATABASE_URL" | grep -qE "^mysql2?://"; then
  echo "▶ Running MySQL migrations..."
  node_modules/.bin/tsx src/lib/db/migrate-mysql-init.ts
  echo "✓ Migrations complete."
fi

exec node server.js

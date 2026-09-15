#!/usr/bin/env bash
# Rebuilds an empty database, starts the app, and walks the journey a brand-new
# deployment goes through. Destroys all local data, so it is a development tool
# only.
#
# Usage: scripts/verify-first-run.sh <path-to-tracker.xlsx>
set -euo pipefail

TRACKER="${1:?usage: scripts/verify-first-run.sh <path-to-tracker.xlsx>}"
PGHOST_="${PGHOST_:-127.0.0.1}"
PGPORT_="${PGPORT_:-5433}"
LOG="${LOG:-/tmp/methodology-dev.log}"

echo "==> stopping any running dev server"
pkill -f "next dev" 2>/dev/null || true
sleep 2

echo "==> resetting database"
psql -h "$PGHOST_" -p "$PGPORT_" -U postgres -c "DROP DATABASE IF EXISTS methodology;" >/dev/null
psql -h "$PGHOST_" -p "$PGPORT_" -U postgres -c "CREATE DATABASE methodology;" >/dev/null
npx prisma migrate deploy >/dev/null
npx tsx prisma/seed.ts >/dev/null
echo "    empty database ready"

echo "==> starting dev server"
npm run dev > "$LOG" 2>&1 &
for _ in $(seq 1 20); do
  sleep 2
  if [ "$(curl -s -o /dev/null -w '%{http_code}' -L http://localhost:3000/setup 2>/dev/null)" = "200" ]; then
    echo "    server ready"
    break
  fi
done

echo "==> walking the first-run journey"
node scripts/first-run-check.mjs "$TRACKER"

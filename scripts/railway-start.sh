#!/bin/sh
set -e

echo "==> PORT=${PORT:-4000}"
echo "==> NODE_ENV=${NODE_ENV:-unset}"

if [ -z "$DATABASE_URL" ]; then
  echo "==> FATAL: DATABASE_URL is not set (use uppercase DATABASE_URL in Railway Variables)"
  exit 1
fi

if [ -z "$DIRECT_DATABASE_URL" ]; then
  echo "==> WARN: DIRECT_DATABASE_URL not set — using DATABASE_URL for migrations too"
  export DIRECT_DATABASE_URL="$DATABASE_URL"
fi

echo "==> DATABASE_URL is set"
case "$DATABASE_URL" in
  *:6543*|*pgbouncer=true*)
    echo "==> WARN: port 6543 / pgbouncer URLs often break Prisma on Railway — use session pooler port 5432"
    ;;
esac

echo "==> Running prisma migrate deploy..."
npm run db:migrate:deploy

echo "==> Starting API..."
exec node apps/api/dist/main.js

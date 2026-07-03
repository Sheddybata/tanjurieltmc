#!/bin/sh

echo "==> PORT=${PORT:-4000}"
echo "==> NODE_ENV=${NODE_ENV:-unset}"
echo "==> DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo 'set' || echo 'MISSING — add DATABASE_URL in Railway Variables')"

# Start API immediately so Railway healthcheck can reach /api/v1/health.
# Migrations run in the background and must not block the server from listening.
if [ -n "$DATABASE_URL" ]; then
  echo "==> Running prisma migrate deploy in background..."
  (npm run db:migrate:deploy && echo "==> Migrations complete") \
    || echo "==> WARN: migrate failed — check DATABASE_URL and Supabase connectivity" &
else
  echo "==> WARN: skipping migrate — DATABASE_URL not set"
fi

echo "==> Starting API..."
exec node apps/api/dist/main.js

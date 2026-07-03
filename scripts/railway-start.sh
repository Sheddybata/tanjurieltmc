#!/bin/sh
set -e

echo "==> PORT=${PORT:-4000}"
echo "==> NODE_ENV=${NODE_ENV:-unset}"

if [ -z "$DATABASE_URL" ]; then
  echo "==> FATAL: DATABASE_URL is not set (use uppercase DATABASE_URL in Railway Variables)"
  exit 1
fi

echo "==> DATABASE_URL is set"
case "$DATABASE_URL" in
  *sslmode=*) echo "==> DATABASE_URL includes sslmode" ;;
  *) echo "==> WARN: append ?sslmode=require to DATABASE_URL if Supabase SSL errors occur" ;;
esac

echo "==> Running prisma migrate deploy..."
npm run db:migrate:deploy

echo "==> Starting API..."
exec node apps/api/dist/main.js

#!/bin/sh
set -e

echo "==> PORT=${PORT:-4000}"
echo "==> DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo 'set' || echo 'MISSING — set it in Railway Variables')"

echo "==> Running prisma migrate deploy..."
npm run db:migrate:deploy

echo "==> Starting API..."
exec node apps/api/dist/main.js

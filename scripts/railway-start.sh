#!/bin/sh

echo "==> PORT=${PORT:-4000}"
echo "==> NODE_ENV=${NODE_ENV:-unset}"

if [ -z "$DATABASE_URL" ]; then
  echo "==> WARN: DATABASE_URL not set — API will start but login will fail"
else
  echo "==> DATABASE_URL is set"
  case "$DATABASE_URL" in
    *:6543*|*pgbouncer=true*)
      echo "==> WARN: use session pooler port 5432 on Railway, not 6543/pgbouncer"
      ;;
  esac
fi

if [ -n "$DATABASE_URL" ] && [ -z "$DIRECT_DATABASE_URL" ]; then
  export DIRECT_DATABASE_URL="$DATABASE_URL"
  echo "==> DIRECT_DATABASE_URL defaulted to DATABASE_URL"
fi

# Do not block startup — Railway healthcheck needs the API listening quickly.
if [ -n "$DATABASE_URL" ]; then
  echo "==> Running prisma migrate deploy in background..."
  (
    npm run db:migrate:deploy && echo "==> Migrations complete"
  ) || echo "==> ERROR: migrate failed — check DATABASE_URL / DIRECT_DATABASE_URL in Railway logs"
fi

echo "==> Starting API..."
exec node apps/api/dist/main.js

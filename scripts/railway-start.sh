#!/bin/sh

# Railway users sometimes paste quotes around URLs — Prisma rejects those.
normalize_url() {
  printf '%s' "$1" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"
}

if [ -n "$DATABASE_URL" ]; then
  DATABASE_URL="$(normalize_url "$DATABASE_URL")"
  export DATABASE_URL
fi

if [ -n "$DIRECT_DATABASE_URL" ]; then
  DIRECT_DATABASE_URL="$(normalize_url "$DIRECT_DATABASE_URL")"
  export DIRECT_DATABASE_URL
fi

echo "==> PORT=${PORT:-4000}"
echo "==> NODE_ENV=${NODE_ENV:-unset}"

if [ -z "$DATABASE_URL" ]; then
  echo "==> WARN: DATABASE_URL not set — API will start but login will fail"
else
  case "$DATABASE_URL" in
    postgresql://*|postgres://*)
      echo "==> DATABASE_URL looks valid (starts with postgres protocol)"
      ;;
    *)
      echo "==> ERROR: DATABASE_URL must start with postgresql:// or postgres://"
      echo "==> First character code may be wrong — remove quotes/spaces in Railway Variables"
      ;;
  esac
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

if [ -n "$DATABASE_URL" ]; then
  echo "==> Running prisma migrate deploy..."
  if npm run db:migrate:deploy; then
    echo "==> Migrations complete"
  else
    echo "==> ERROR: migrate failed — API will start but customer login and new features may fail"
    echo "==> If a migration failed earlier, run in Supabase SQL editor:"
    echo "    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS label TEXT;"
    echo "    ALTER TABLE accounts ADD COLUMN IF NOT EXISTS \"maturityDate\" TIMESTAMP(3);"
    echo "    ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS \"loanId\" TEXT;"
    echo "    Then: npx prisma migrate resolve --applied <migration_name>"
  fi
fi

echo "==> Starting API..."
exec node apps/api/dist/main.js

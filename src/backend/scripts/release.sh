#!/bin/sh
# release.sh — idempotent migration bootstrap + deploy.
#
# Handles three deploy states:
#   1. Fresh DB                    → migrate deploy creates everything.
#   2. Existing `db push` DB       → schema already there but no migration
#                                    history; we mark the baseline applied.
#   3. Already migration-managed   → resolve is a no-op, deploy applies any
#                                    pending migrations.
#
# Wire this in Railway as the release / pre-deploy command:
#   npm run release

set -e

INIT_MIGRATION="20260501000000_init"
SCHEMA="prisma/schema.prisma"

# Probe: does the users table exist? If yes, the schema is already deployed
# and we may need to retroactively register the baseline migration.
if echo "SELECT 1 FROM users LIMIT 1;" \
     | npx prisma db execute --stdin --schema "$SCHEMA" >/dev/null 2>&1; then
  echo "[release] Existing schema detected — ensuring baseline is recorded."
  # Idempotent: succeeds whether or not the migration is already recorded.
  # We swallow the error in the already-recorded case.
  npx prisma migrate resolve --applied "$INIT_MIGRATION" 2>/dev/null || true
fi

echo "[release] Applying any pending migrations…"
npx prisma migrate deploy

echo "[release] Done."

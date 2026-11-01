#!/usr/bin/env bash
# Runs the end-to-end suite: fresh local D1, test admin, Pages Functions via `wrangler pages dev`, mock ImageKit.
set -euo pipefail
export WRANGLER_SEND_METRICS=false
cd "$(dirname "$0")/.."
rm -rf .wrangler/state
cat > .dev.vars <<VARS
IMAGEKIT_PRIVATE_KEY=private_test_key=
IMAGEKIT_PUBLIC_KEY=public_test
IMAGEKIT_URL_ENDPOINT=http://127.0.0.1:9911/ik/test
IMAGEKIT_API_URL=http://127.0.0.1:9911/v1
IMAGEKIT_UPLOAD_URL=http://127.0.0.1:9911/upload
VARS
npx wrangler d1 migrations apply spectra-db --local >/dev/null
ADMIN_EMAIL=admin1@test.invalid ADMIN_NAME="Test Admin" ADMIN_PASSWORD="Correct-Horse-Battery-1" npx tsx scripts/db/create-admin.ts --local
[ -d out ] || npm run build
npx wrangler pages dev out --port 8788 --ip 127.0.0.1 > /tmp/pages-dev.log 2>&1 &
PID=$!; trap 'kill $PID 2>/dev/null || true; rm -f .dev.vars' EXIT
for i in $(seq 1 60); do curl -sf http://127.0.0.1:8788/api/health >/dev/null && break; sleep 1; done
node --import tsx tests/e2e.ts

#!/usr/bin/env bash
# Builds the app on React's profiling renderer, seeds the demo account, and
# drives the measured scenarios against it.
#
#   scripts/profile/run.sh <label> [runs]
#
# Writes .artifacts/profile/<label>.json at the repo root. Needs frontend/.env.test
# and signs in as its E2E_CLERK_USER_EMAIL; it creates no Clerk users.
# PROFILE_ONLY=<scenario> runs one scenario.
#
# To compare two versions, run `run.sh base` on the baseline source, apply the
# change, run `run.sh candidate`, then from the repo root:
#   node frontend/scripts/profile/measure.ts compare \
#     .artifacts/profile/base.json .artifacts/profile/candidate.json
# Timings drift between sessions, so run several of each, interleaved, and pool
# them with "+" (base-1.json+base-2.json). Render counts are stable.
set -euo pipefail

cd "$(dirname "$0")/../.."
label=$1
runs=${2:-5}
out=$(cd .. && pwd)/.artifacts/profile
frontend_port=5312
backend_port=3312
mkdir -p "$out"

set -a
. ./.env.test
set +a
export VITE_AUTH_MODE=clerk VITE_BILLING_MODE=managed VITE_SUPPORT_EMAIL=support@macrotrackr.com
export VITE_API_URL=http://localhost:$backend_port
export PROFILE_URL=http://localhost:$frontend_port PROFILE_API_URL=$VITE_API_URL

# An existing build is reused, so a label can be measured again later. Delete
# its dist directory to rebuild from the current source.
if [ ! -d "$out/dist-$label" ]; then
  bunx vite build --config scripts/profile/vite.config.ts --outDir "$out/dist-$label" --emptyOutDir
fi

# A killed backend leaves its writes in the WAL, and a plain copy drops them.
checkpoint() { bun -e "new (require('bun:sqlite').Database)('$1').exec('PRAGMA wal_checkpoint(TRUNCATE)')"; }

pids=()
cleanup() { for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done; }
trap cleanup EXIT

start_backend() {
  (cd ../backend && AUTH_MODE=clerk APP_MODE=managed BILLING_MODE=managed PORT=$backend_port \
    DATABASE_PATH="$1" APP_URL=$PROFILE_URL CORS_ORIGIN=$PROFILE_URL \
    STRIPE_SECRET_KEY=sk_test_profile STRIPE_WEBHOOK_SECRET=whsec_profile \
    STRIPE_PRICE_ID_MONTHLY=price_profile_monthly STRIPE_PRICE_ID_YEARLY=price_profile_yearly \
    exec bun --no-env-file src/index.ts) >"$out/backend.log" 2>&1 &
  backend_pid=$!
  pids+=("$backend_pid")
  until curl -sf "$PROFILE_API_URL/api/health" >/dev/null; do sleep 0.5; done
}

bunx vite preview --config scripts/profile/vite.config.ts --outDir "$out/dist-$label" \
  --port $frontend_port --strictPort >"$out/preview.log" 2>&1 &
pids+=("$!")
until curl -sf "$PROFILE_URL" >/dev/null; do sleep 0.5; done

# The seed copies a database that already holds the e2e user, so link that
# user through the app once before seeding.
# demo.db pins "today" to the day it was seeded; delete it to reseed.
if [ ! -f "$out/demo.db" ]; then
  rm -f "$out"/base.db*
  start_backend "$out/base.db"
  node scripts/profile/measure.ts prepare
  kill "$backend_pid"
  wait "$backend_pid" 2>/dev/null || true
  checkpoint "$out/base.db"
  (cd ../backend && DATABASE_PATH="$out/base.db" DEMO_DATABASE_PATH="$out/demo.db" \
    DEMO_TODAY=$(date +%F) bun --no-env-file scripts/seed-demo.ts)
  checkpoint "$out/demo.db"
fi

# Every label starts from the same data, so its runs see the same sequence.
rm -f "$out"/run.db*
cp "$out/demo.db" "$out/run.db"
start_backend "$out/run.db"
node scripts/profile/measure.ts measure "$runs" "$out/$label.json"
echo "wrote $out/$label.json"

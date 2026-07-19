#!/usr/bin/env bash
# scripts/ios/verify-bearer-auth.sh
#
# Regression suite for the additive bearer-token auth path on /api/ask/*
# (docs/ios/06-backend-changes.md §3.4). Re-run this after ANY change to
# middleware.ts, lib/supabase-server.ts, or the ask route handlers.
#
# It covers the bearer path and the "no credentials" path. The COOKIE path
# cannot be exercised from curl — after running this, sign in on the site in a
# browser and send an Ask message to confirm the web chat still streams.
#
# Usage:
#   TOKEN=<supabase access_token> BASE_URL=http://localhost:3000 \
#     bash scripts/ios/verify-bearer-auth.sh
#
# Get a token with the anon key from .env.local:
#   npx tsx -e 'import {createClient} from "@supabase/supabase-js";
#     const c=createClient(process.env.URL!,process.env.ANON!);
#     const {data,error}=await c.auth.signInWithPassword({email:"…",password:"…"});
#     console.log(error ?? data.session!.access_token);'
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
: "${TOKEN:?TOKEN is required — a Supabase access_token for a test user}"

pass=0
fail=0

# check <label> <expected> <actual>
check() {
  if [[ "$2" == "$3" ]]; then
    printf '  PASS  %-46s %s\n' "$1" "$3"
    pass=$((pass + 1))
  else
    printf '  FAIL  %-46s expected %s, got %s\n' "$1" "$2" "$3"
    fail=$((fail + 1))
  fi
}

echo "bearer-auth regression against ${BASE_URL}"
echo

# 1. Bearer token streams. Only the first events matter; head closes the pipe.
echo "1. POST /api/ask/stream with bearer"
stream=$(curl -sN --max-time 45 "${BASE_URL}/api/ask/stream" \
  -H 'content-type: application/json' \
  -H "authorization: Bearer ${TOKEN}" \
  -d '{"message":"What is a pendulum?"}' 2>/dev/null | head -c 2000 || true)
if grep -q 'event: meta' <<<"$stream"; then
  check "stream emits meta event" "yes" "yes"
else
  check "stream emits meta event" "yes" "no"
  echo "        first bytes: $(head -c 300 <<<"$stream")"
fi

# 2. No credentials at all → 401 from middleware, before the route body runs.
echo
echo "2. No credentials"
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE_URL}/api/ask/stream" \
  -H 'content-type: application/json' -d '{}')
check "POST /api/ask/stream (no auth)" "401" "$code"

# 3. Bearer on the conversations collection.
echo
echo "3. Conversations with bearer"
code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/api/ask/conversations" \
  -H "authorization: Bearer ${TOKEN}")
check "GET /api/ask/conversations" "200" "$code"

# 4. Garbage bearer must NOT be trusted. Middleware lets it through on header
#    presence; the route validates and rejects. 401, never 500.
echo
echo "4. Garbage bearer"
code=$(curl -s -o /dev/null -w '%{http_code}' "${BASE_URL}/api/ask/conversations" \
  -H 'authorization: Bearer nonsense')
check "GET /api/ask/conversations (bad token)" "401" "$code"

code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "${BASE_URL}/api/ask/stream" \
  -H 'content-type: application/json' -H 'authorization: Bearer nonsense' -d '{}')
check "POST /api/ask/stream (bad token)" "401" "$code"

echo
echo "${pass} passed, ${fail} failed"
echo "REMINDER: cookie path is not covered here — verify web chat in a browser."
[[ "$fail" -eq 0 ]]

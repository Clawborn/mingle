#!/bin/bash
# Bot turn loop — calls bot-turn API every 30 seconds
# Usage: nohup bash scripts/bot-loop.sh &

API_BASE="https://clawborn.live"
AUTH_KEY="${BOT_ADMIN_KEY:-${SUPABASE_SERVICE_ROLE_KEY:-}}"

while true; do
  curl -s -X POST "$API_BASE/api/bot-turn" \
    -H "Authorization: Bearer $AUTH_KEY" \
    -H "Content-Type: application/json" \
    2>/dev/null | head -c 200
  echo ""
  sleep 30
done

#!/usr/bin/env bash
# Verify a clip against the enrolled "demo-speaker": same voice -> match, different voice -> no-match.
set -euo pipefail
cd "$(dirname "$0")"

VTG_URL="https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api"
VTG_KEY="vtg_live_1fb3a329a4c4568b3fc9fa953e18e7dd62b7fa33"   # public demo key (rate-limited, revocable)
pp(){ command -v jq >/dev/null && jq . || cat; }

echo "== [1] Verify the SAME synthetic voice (expect likely_same_person) =="
curl -s -X POST "$VTG_URL" -H "X-API-Key: $VTG_KEY" \
  -F "action=verify" -F "subject_id=demo-speaker" \
  -F "audio=@sample_match.wav" | pp

echo
echo "== [2] Verify a DIFFERENT synthetic voice (expect likely_different_person) =="
curl -s -X POST "$VTG_URL" -H "X-API-Key: $VTG_KEY" \
  -F "action=verify" -F "subject_id=demo-speaker" \
  -F "audio=@sample_different.wav" | pp

echo
echo "== [3] A bad key returns HTTP 401 =="
curl -s -o /dev/null -w "HTTP %{http_code}\n" -X POST "$VTG_URL" \
  -H "X-API-Key: vtg_live_totally_wrong_key" \
  -F "action=verify" -F "subject_id=demo-speaker" -F "audio=@sample_match.wav"

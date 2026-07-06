#!/usr/bin/env bash
# Enroll the synthetic "demo-speaker" voiceprint from two Piper (MIT) clips.
set -euo pipefail
cd "$(dirname "$0")"

VTG_URL="https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api"
VTG_KEY="vtg_live_1fb3a329a4c4568b3fc9fa953e18e7dd62b7fa33"   # public demo key (rate-limited, revocable)

echo "Enrolling subject 'demo-speaker' from 2 synthetic clips..."
curl -s -X POST "$VTG_URL" \
  -H "X-API-Key: $VTG_KEY" \
  -F "action=enroll" \
  -F "subject_id=demo-speaker" \
  -F "audio=@sample_enroll_1.wav" \
  -F "audio=@sample_enroll_2.wav" | { command -v jq >/dev/null && jq . || cat; }

echo
echo "Done. Now run ./curl_verify.sh"

# Submit Voice Truthgate to the Claude Connectors Directory

The Connectors Directory is the biggest Claude-side distribution channel — a Claude user adds our
connector and can verify a caller's voice from any chat. This is the prep; the actual submit is an owner
action (needs the mosADD org account).

## What Claude requires (and our status)

| Requirement | Status |
|---|---|
| **Remote MCP endpoint** (HTTP) | ✅ **LIVE** — `https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-mcp` (hosted as a Supabase Edge Function). Verified end-to-end. |
| **Transport** | ✅ HTTP JSON-RPC (initialize / tools/list / tools/call), stateless JSON. |
| **Auth** | ✅ Bearer token — the user's own `vtg_live_…` key (they get one at mosadd.com). Supabase passes `Authorization: Bearer` through. |
| **Tool annotations** (readOnly / destructive) | ✅ verify + list = `readOnlyHint`; enroll = `destructiveHint`. |
| **Privacy policy** | ✅ https://mosadd.com/privacy (voice/biometric). |
| **HTTPS + valid cert** | ✅ (Supabase-hosted). |
| **Tool descriptions honest** | ✅ "signal, not verdict" + synthetic-clone caution baked into each. |
| **Screenshots (3–5)** | ⛔ owner to capture (verify + list in a Claude chat). |

> The endpoint is live now on the Supabase URL — **no deploy or DNS is required to submit.** A branded
> `mcp-truthgate.mosadd.com` (or a box-hosted variant, see [`../remote-mcp`](../remote-mcp)) is an optional
> cosmetic upgrade later.

## Submit (owner — the only remaining step)
1. Sanity-check the live handshake (already verified):
   `curl -s -X POST https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-mcp -H "Authorization: Bearer vtg_live_…" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"voice_truthgate_list_subjects","arguments":{}}}'`
2. Claude.ai → **Settings → Connectors → Add custom connector / Submit to directory**.
   - **URL:** `https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-mcp`
   - **Auth:** API key / Bearer — users paste their `vtg_live_…` key.
   - **Privacy policy:** `https://mosadd.com/privacy`
   - **Description:** "Honest voice authenticity for your agents — enrol a voice, verify a call clip.
     A confidence-banded signal, never a bare verdict (a targeted clone can match ~63% of the time —
     fuse with identity + liveness for high-stakes actions)."
   - Attach 3–5 screenshots (verify + list in a Claude chat).
3. Review is typically ~1–2 weeks.

## Honesty rail
Keep "signal, not verdict" + the 63%-clone caveat in the listing copy. This is availability (be there
when a Claude user looks), not a loud launch — a loud launch stays gated on legal review.

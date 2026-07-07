# Submit Voice Truthgate to the Claude Connectors Directory

The Connectors Directory is the biggest Claude-side distribution channel — a Claude user adds our
connector and can verify a caller's voice from any chat. This is the prep; the actual submit is an owner
action (needs the mosADD org account).

## What Claude requires (and our status)

| Requirement | Status |
|---|---|
| **Remote MCP endpoint** (Streamable HTTP) | ✅ built + tested — [`../remote-mcp`](../remote-mcp). Deploy = 1 owner approval (below). |
| **Transport** | ✅ Streamable HTTP, stateless JSON (same as `mcp.mosadd.com`). |
| **Auth** | ✅ Bearer token — the user's own `vtg_live_…` key (they get one at mosadd.com). |
| **Tool annotations** (readOnly / destructive) | ✅ verify + list = `readOnlyHint`; enroll = `destructiveHint`. |
| **Privacy policy** | ✅ https://mosadd.com/privacy (voice/biometric). |
| **HTTPS + valid cert** | ✅ via Caddy auto-TLS on deploy. |
| **Tool descriptions honest** | ✅ "signal, not verdict" + synthetic-clone caution baked into each. |
| **Screenshots (3–5)** | ⛔ owner to capture once deployed (verify + list in a Claude chat). |

## Two owner approvals to go live
1. **DNS:** add `mcp-truthgate.mosadd.com → <box IP>` (A-record; the api.mosadd.com pattern). Until then a
   `mcp.<ip>.sslip.io` hostname works with real TLS and no DNS change.
2. **Deploy:** run the [`../remote-mcp`](../remote-mcp) runbook on the box (`docker build` + `docker run`
   on `vtgnet` + one Caddy block). ~2 minutes; the existing `truthgate-api` block is untouched.

## Submit (owner)
1. Deploy the endpoint (above); confirm the `tools/call voice_truthgate_list_subjects` handshake returns
   JSON over HTTPS.
2. Claude.ai → **Settings → Connectors → Add custom connector / Submit to directory**.
   - **URL:** `https://mcp-truthgate.mosadd.com/mcp`
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

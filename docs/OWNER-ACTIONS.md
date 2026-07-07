# Owner actions — the short list

Everything the agent built is done + tested. These are the steps that genuinely need the founder (org
logins, global-effect infra, legal). Ordered by leverage.

## Distribution (get us in front of users)
1. **Create the OpenAI Custom GPT** — paste-ready config in [`OPENAI-GPT-SETUP.md`](./OPENAI-GPT-SETUP.md).
   ~2 min in the mosADD OpenAI org → publish public. (Only the org login is owner-only.)
2. ~~Deploy the remote MCP endpoint~~ — ✅ **DONE, live now** at
   `https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-mcp` (hosted serverless — no box
   or DNS needed). Verified end-to-end.
3. **Submit the Claude Connector** — steps in [`CLAUDE-CONNECTOR-SUBMISSION.md`](./CLAUDE-CONNECTOR-SUBMISSION.md).
   The endpoint is live, so this needs only **3–5 screenshots + clicking Submit** in Claude.ai settings.
   Review ~1–2 wks.

## Nice-to-have infra
4. **`privacy@mosadd.com` mailbox alias** — the privacy policy (live at mosadd.com/privacy) points to it.
5. **Branded `api.mosadd.com`** — Supabase custom-domain add-on (paid; whole-project change — CTO-1 lane).

## R&D / product (greenlight or hand to CTO-1)
6. **verified-human/agent badges** — logic done; the in-app UI wiring is **CTO-1's lane**
   ([`HANDOFF-verified-badges-cto1.md`](./HANDOFF-verified-badges-cto1.md)).
7. **8 kHz telephony fine-tune** — cheap calibration-layer first; GPU fine-tune only if needed + greenlit
   ([`PROPOSAL-8khz-telephony.md`](./PROPOSAL-8khz-telephony.md)).
8. **Real L3 calibration** — the live-rhythm trigger stays sealed until we capture real agent-vs-human
   voice turns (`voice_turn_events`). Needs a voice-capable agent + a consent surface. Until then L3 is a
   published proof + a measured human baseline, not a live trigger.

## Gate on everything loud
9. **Legal review** of the ToS / limitations / defamation copy before any **loud** launch (HN, press,
   big claims). Drafts are ready in [`BLOG-xai-authenticity-for-voice-agents.md`](./BLOG-xai-authenticity-for-voice-agents.md)
   + [`LAUNCH-DRAFTS.md`](./LAUNCH-DRAFTS.md) — none published.

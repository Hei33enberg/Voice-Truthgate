# Launch drafts — Voice Truthgate

> **All drafts below are held for legal review before publishing.** This is *availability + honest
> proof*, not a hype campaign. Keep "signal, not verdict", the 63%-clone number, and "no literal 100%"
> in everything. Nothing here is posted until the ToS/limitations/defamation copy is cleared.

---

## Show HN (draft)

**Title:** Show HN: Voice Truthgate – honest voice authenticity for AI agents (we publish our own 63% clone rate)

**Body:**
Voice agents are suddenly everywhere (xAI Voice Agent Builder, OpenAI Realtime, Vapi, Retell…), but none
of them answer "is the caller actually who they claim to be?" We built a layer that does — as an MCP
server + a REST API you drop into any agent.

The honest part: we attacked our own voiceprint with a targeted clone and it got in ~63% of the time. So
we don't sell a "deepfake detector" (we measured — standalone detection on modern TTS is a losing game).
We sell *fusion*: identity + voiceprint + live-conversation rhythm, returned as a confidence band, never
a verdict.

The interesting bit is the rhythm layer. A half-duplex STT→LLM→TTS bot physically can't overlap-talk,
backchannel, or reply <300 ms after you stop. We measured real human conversation (AMI corpus, 171
meetings): humans overlap ~19% of talk-time and take ~66% of turns faster than 300 ms. A bot is 0% on
both by construction — and you can only see it if you own the live channel's ms timestamps.

Open MIT SDK + MCP + OpenAPI + a 2-minute runnable demo. Feedback welcome, especially on the honesty
framing — we'd rather under-claim.

*(Comment-ready follow-ups: the AMI method, why we keep the rhythm trigger weight-zero until it's
calibrated on real data, and how the identity signal kills the bot-false-alarm.)*

---

## X / thread (draft)

1/ Voice agents went mainstream this month. Nobody shipped the part that matters: **is the caller real?**
We built Voice Truthgate — an honest authenticity layer you plug into any agent (MCP + REST). 🧵

2/ First, the uncomfortable truth we put in our own README: we cloned a voice and it beat our voiceprint
**~63%** of the time. If a vendor tells you "99% deepfake detection," ask for their clone rate.

3/ So we don't sell a detector. We sell **fusion**: identity (is this a known bot or a human?) +
voiceprint + live-conversation rhythm → a confidence band, never a verdict.

4/ The moat is rhythm. A half-duplex bot can't talk over you or reply <300 ms after you stop. Real humans
(AMI corpus, 171 meetings): **~19% overlap, ~66% of turns <300 ms.** Bots: **0%, by construction.**

5/ You can only measure that if you own the live channel's millisecond timestamps. A competitor with just
an audio file can't. That's the un-copyable part.

6/ Honest to a fault: that rhythm trigger stays **off** until it's calibrated on real captured
agent-vs-human calls. We publish the method + the human baseline; we don't fake the switch.

7/ Drop-in: `npx -y @mosadd/voice-truthgate-mcp`, an OpenAPI spec (import as a GPT Action), recipes for
Claude/OpenAI/Vercel/v0/xAI, and a 2-min demo. Signal, not verdict. Links 👇

---

## 30-second demo (script / gif spec)

Reuse [`examples/demo-enroll-verify`](../examples/demo-enroll-verify). Screen-record a terminal:
1. `./curl_enroll.sh` → `{ enrolled: true, subject_id: "demo-speaker" }` (1s).
2. `./curl_verify.sh` (same voice) → highlight `verdict: likely_same_person`, `confidence_band: high`,
   **and** `synthetic_caution: true` — the honesty on screen (2s).
3. Same script, different voice → `likely_different_person`, `0.10`.
4. End card: "A signal, not a verdict. mosadd.com/voice-truthgate".
Keep it real terminal output (no mockups). ~30s, loopable gif for the blog + X.

---

## Collaboration outreach (one-liners, honest)

- **xAI** — "Your Voice Agent Builder connects MCP servers but has no caller-authenticity story. We're the
  one honest authenticity MCP in the registry — feature us as the guardrail; we're explicit about limits."
- **ElevenLabs** — "We already credit 'backed by ElevenLabs'. Let's co-market the authenticity layer for
  Conversational AI — you generate voices, we add the honest 'is it really them, live?' check."
- **A CCaaS / voice-biometric buyer** — "As AWS Voice ID sunsets (May 2026) and Azure Speaker Recognition
  retires, here's an MCP-native, honest, signal-not-verdict layer — no contact-center appliance required."

Distribution surfaces we're already in: the official MCP Registry, npm, the OpenAPI spec. Add: HN,
r/LocalLLaMA, dev newsletters — after legal clears the copy.

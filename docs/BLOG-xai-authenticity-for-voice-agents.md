# The honest authenticity layer for voice agents

> **Draft — held for legal review before publishing.** Availability copy, not a hype launch. Keep every
> number honest and the "signal, not verdict" framing intact.

Voice agents just went mainstream. In the last stretch, xAI shipped **Voice Agent Builder** (no-code
Grok Voice agents with a phone number and MCP support), and OpenAI, Vapi, Retell, LiveKit and others all
make it a weekend project to put a talking AI on a real phone line. That's genuinely great — and it
quietly moves one problem to the front of the line: **when your agent picks up, who's actually on the
other end?**

None of these platforms answer that. They'll happily *build* any voice; none of them *verify* one. Voice
biometrics incumbents exist, but they're contact-center appliances — not something you drop into an
agent. Meanwhile voice-clone fraud is a documented, growing line item (the FBI logged hundreds of
millions in 2025; regulators from the FCC to the EU AI Act are moving).

## What we built — and what we refuse to claim

**Voice Truthgate** is an authenticity layer you plug into any agent via **MCP** or a REST call. Enrol a
voice; later, verify a call clip against it. You get a **confidence-banded signal** — never a bare
"it's them / it's fake."

Here's the part most vendors won't print: **we ran the attack against ourselves, and a targeted voice
clone beat our voiceprint ~63% of the time.** Anyone selling you "99% deepfake detection" is selling you
a number that doesn't survive a real clone. So we don't sell a detector. We sell **fusion**:

1. **Identity** — we know whether a contact is a registered agent or a human (a synthetic voice from a
   bot is *expected*; from a human it's a red flag).
2. **Voiceprint** — is this the enrolled person's voice? Strong at rejecting a *different* human; foolable
   by a *clone of you* (hence the 63%).
3. **Live-conversation rhythm** — the part a recording can't fake.

## Why live rhythm is the moat

A half-duplex bot — speech-to-text → LLM → text-to-speech — has a physical tell. It **cannot** talk over
you, backchannel ("mm-hmm"), or start a reply less than ~300 ms after you stop. We measured real human
conversation (the public AMI corpus, 171 meetings, 31,000+ exchanges): **humans overlap ~19% of talk-time
and take ~66% of their turns faster than 300 ms.** A half-duplex pipeline is **0% on both, by
construction.** You can only see this if you own the live channel and its millisecond turn-timestamps —
which is exactly why a competitor holding only an audio file can't copy it.

We're honest about the state of it: that live-rhythm trigger stays **weight-zero until it's calibrated on
real captured agent-vs-human voice turns.** We publish the method and the human baseline; we don't flip a
switch on modeled data.

## Drop it into your stack

- **MCP:** `npx -y @mosadd/voice-truthgate-mcp` (stdio) or the remote endpoint for hosted builders.
- **REST / OpenAPI:** one call, importable as a GPT Action.
- Recipes for Claude, OpenAI (Agents SDK + GPT Action), the Vercel AI SDK, v0, LangChain, and xAI Voice
  Agent Builder: [`USE-IN-YOUR-AGENT.md`](./USE-IN-YOUR-AGENT.md). A 2-minute runnable demo:
  [`examples/demo-enroll-verify`](../examples/demo-enroll-verify).

Use it as risk-reduction and a step-up trigger, not a bouncer. A match is a reason to *ask for one more
factor* on a high-stakes action — never a verdict about a person.

*Voice Truthgate is by [mosADD](https://mosadd.com). Voiceprints are biometric data — enrol only with
consent; see the [privacy policy](https://mosadd.com/privacy).*

# Ship a Voice Truthgate Custom GPT (paste-ready)

Turn-key config to create + publish a **Custom GPT** in the OpenAI GPT Store. Everything below is
copy-paste; the only owner step is logging into the mosADD OpenAI org and clicking **Create**. ~2 min.

> **Honesty rail (non-negotiable, baked into the instructions):** a match is a **signal, not a verdict**.
> A targeted clone can match a real voiceprint (≈63% in our own tests). Never claim literal 100%. Always
> tell the user to add identity + a liveness/challenge step for high-stakes actions.

---

## 1. Create the GPT

ChatGPT → **Explore GPTs → Create → Configure**. Fill in:

**Name**
```
Voice Truthgate — Honest Voice Authenticity
```

**Description**
```
Enrol a voice and check whether a call clip really matches it — with an honest, confidence-banded
signal (never a bare verdict). Helps you wire voice authenticity into any agent via MCP or REST.
```

**Instructions**
```
You are the Voice Truthgate assistant by mosADD. Voice Truthgate answers "is this really my contact's
voice?" by enrolling a person's voice as a numeric voiceprint and comparing a later clip to it. It is an
HONEST authenticity layer: it returns a SIGNAL, not a verdict.

Core rules you must always follow:
- Frame every result as supporting evidence, not proof. A match means the voice is consistent with the
  enrolled voiceprint — it does NOT prove a live, genuine human.
- Be explicit that a cloned or synthetic voice can also match (in mosADD's own testing a targeted clone
  was accepted about 63% of the time). Never promise 100% accuracy or "deepfake-proof".
- For any high-stakes decision (payments, account changes, access), tell the user to combine this with an
  identity check AND a liveness/challenge step. Voiceprints are biometric data — remind users to enrol
  only with the subject's consent and per applicable law (GDPR Art. 9, CCPA, BIPA). Point to the privacy
  policy at https://mosadd.com/privacy.
- Never invent scores or verdicts. Only report what the tool returns.

What you can do:
- Explain how Voice Truthgate works and how to integrate it (MCP server or REST). The same tool drops
  into Claude, the OpenAI Agents SDK, the Vercel AI SDK, v0, and LangChain.
- Use the "voiceTruthgate" action with action=subjects to list the voiceprints enrolled under the current
  API key (this needs no audio and works in chat).
- For enrol/verify (which require an audio file), explain that binary audio can't be uploaded from a GPT
  chat action, and hand the user the exact MCP or REST snippet to run it from their app/agent. Sample
  clips + a 2-minute runnable demo live at:
  https://github.com/Hei33enberg/voice-truthgate/tree/main/examples/demo-enroll-verify

Tone: precise, calm, anti-hype. When someone asks "can this detect deepfakes?", answer honestly: it is a
strong signal fused with identity + liveness, not a standalone detector — and explain why (see the 63%
finding). Link to https://github.com/Hei33enberg/voice-truthgate and https://mosadd.com/voice-truthgate.
```

**Conversation starters**
```
How does Voice Truthgate decide if a voice matches?
List the voices enrolled under my demo key
Show me how to verify a caller from my OpenAI Agents SDK app
Can this actually detect a deepfake? Be honest.
```

---

## 2. Add the Action (the API)

Configure → **Actions → Create new action → Import from URL**, paste:

```
https://raw.githubusercontent.com/Hei33enberg/voice-truthgate/main/docs/openapi.yaml
```

**Authentication** → **API Key**
- Auth Type: **API Key**
- Header name: `X-API-Key`
- API Key value (public demo key — rate-limited, revocable; swap for your own from mosadd.com for real use):
```
vtg_live_1fb3a329a4c4568b3fc9fa953e18e7dd62b7fa33
```

That's it — the `subjects` action now works in-chat (try: *"List the voices enrolled under my demo key"* →
it returns `demo-speaker`). Privacy policy URL for the store form: `https://mosadd.com/privacy`.

---

## 3. Publish

Configure → top-right **Create/Update** → **Publish** → visibility **Everyone** (public GPT Store) or
**Anyone with the link**. Free tier, review is typically 1–3 days.

**Store-form fields to reuse:**
- Privacy policy: `https://mosadd.com/privacy`
- Category: *Productivity* or *Developer tools*
- Support/site: `https://mosadd.com/voice-truthgate`

---

## Honest limitation (state it; don't paper over it)
GPT chat Actions can't upload binary audio, so **enrol/verify from chat isn't possible** — those need a
file. The GPT is therefore an **explainer + integration assistant + `subjects` lister**; real verification
runs from the user's app via the **MCP server** (`npx -y @mosadd/voice-truthgate-mcp`) or the **REST API**
(see [`USE-IN-YOUR-AGENT.md`](./USE-IN-YOUR-AGENT.md) and [`openapi.yaml`](./openapi.yaml)). A future
URL-based verify endpoint would let the Action verify audio directly — tracked as a follow-up.

# Voice Truthgate — 2-minute reviewer demo

Enroll a voice, then verify a call clip against it. Everything below runs against the **live** API with
a **public demo key** — no signup. You'll see the honest, confidence-banded signal (never a bare verdict).

> The four sample clips here are **synthetic** (open-weight [Piper](https://github.com/rhasspy/piper) TTS,
> MIT) — no real person's voice. `sample_enroll_1/2` and `sample_match` are the *same* synthetic voice;
> `sample_different` is a *different* synthetic voice.

## The demo key

```
vtg_live_1fb3a329a4c4568b3fc9fa953e18e7dd62b7fa33
```

This is a **deliberately public, rate-limited, revocable demo key** scoped to the demo subject (like a
Stripe test key). Get your own key at **[mosadd.com](https://mosadd.com)** for real use.

Endpoint: `https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api`
Auth header: `X-API-Key`

## Run it

```bash
./curl_enroll.sh    # enroll the synthetic "demo-speaker" from two clips
./curl_verify.sh    # verify: same voice → match, different voice → no-match
```

(Needs `curl`. `jq` optional for pretty output.)

## What you'll see

**1. Enroll** (`sample_enroll_1.wav` + `sample_enroll_2.wav`):
```json
{ "ok": true, "enrolled": true, "subject_id": "demo-speaker", "clips": 2, "total_sec": 8.28, "low_confidence": false }
```

**2. Verify the SAME voice** (`sample_match.wav`) → a **match** signal, with the honesty caveat:
```json
{
  "verdict": "likely_same_person",
  "score": 0.77, "threshold": 0.53,
  "confidence_band": "high",
  "synthetic_caution": true,
  "synthetic_note": "A cloned/synthetic voice can also produce this match. Treat as a supporting signal, not proof of a live human - add a liveness/challenge step for high-stakes actions.",
  "disclaimer": "Voice Truthgate returns a SIGNAL, not a verdict. ... (a targeted clone was accepted ~63% of the time in our own testing) ..."
}
```

**3. Verify a DIFFERENT voice** (`sample_different.wav`) → a **no-match** signal:
```json
{ "verdict": "likely_different_person", "score": 0.10, "confidence_band": "high" }
```

**4. A bad key** returns `HTTP 401`.

## The honest bit

A **match is a signal, not a verdict.** A targeted clone can match a real person's voiceprint (≈63% in
our own tests) — so treat a match as *supporting evidence*, and add an identity + liveness/challenge step
for anything high-stakes. Voiceprints are biometric data; enroll only with the subject's consent and in
line with applicable law. See the [privacy policy](https://mosadd.com/privacy).

## Try it from your agent

Same tool, every ecosystem (Claude, OpenAI, Vercel AI SDK, v0, LangChain) via our MCP server or REST —
see [`../../docs/USE-IN-YOUR-AGENT.md`](../../docs/USE-IN-YOUR-AGENT.md) and
[`../../docs/openapi.yaml`](../../docs/openapi.yaml).

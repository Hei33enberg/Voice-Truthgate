# Voice Truthgate — market API

An honest, on-your-network answer to **"is this really my contact, on this call?"** You enrol the
voices you want to protect, then verify a call clip against a subject and get back a
confidence-banded **signal** (never a bare verdict), with a synthetic/clone caution and a legal
disclaimer. Two forms, one engine:

- **REST API** — for contact centres, IVRs, or any app.
- **[MCP tool](../mcp/)** — for AI agents (Claude, our fleet, a customer's agent).

> **What it is under the hood:** an ECAPA-TDNN speaker-verification engine (live at
> `truthgate-api.mosadd.com`) behind a multi-tenant, API-key gateway that holds the biometric
> server-side (the customer never sees the raw voiceprint or the engine key). Measured operating
> point: ~4.6% EER on clean real speech, 0% acceptance of *untargeted* synthetic voices.

## Get a key

Keys are provisioned by mosADD (owner-gated in v1 — self-serve issuance is a follow-up). A key looks
like `vtg_live_…`; you send it as the `X-API-Key` header on every request. We store only a hash of it.

## Endpoint & auth

```
POST https://rooffhgbxafyjcwmwpsy.supabase.co/functions/v1/voice-truthgate-api
Header: X-API-Key: <your key>
Body:   multipart/form-data
```

*(A branded `api.mosadd.com` host is a planned follow-up; the URL above is the live endpoint today.)*

## Actions (form field `action`)

### `enroll` — register a subject's voice
Fields: `subject_id` (you choose it), `audio` (1–8 clean clips, ≥3s each is best).
```bash
curl -X POST "$VTG_URL" -H "X-API-Key: $KEY" \
  -F action=enroll -F subject_id=acme-ceo \
  -F audio=@ceo_1.wav -F audio=@ceo_2.wav
# → { "ok": true, "enrolled": true, "subject_id": "acme-ceo", "total_sec": 16.4, "note": "Enrolled." }
```

### `verify` — check a clip against a subject
Fields: `subject_id`, `audio` (one clip), optional `threshold`.
```bash
curl -X POST "$VTG_URL" -H "X-API-Key: $KEY" \
  -F action=verify -F subject_id=acme-ceo -F audio=@incoming_call.wav
```
```json
{
  "ok": true,
  "subject_id": "acme-ceo",
  "verdict": "likely_same_person",
  "score": 0.81, "threshold": 0.53,
  "confidence_band": "high",
  "synthetic_caution": true,
  "synthetic_note": "A cloned/synthetic voice can also produce this match ...",
  "disclaimer": "Voice Truthgate returns a SIGNAL, not a verdict ..."
}
```

### `subjects` — list your enrolled subjects
`-F action=subjects` → `{ "ok": true, "subjects": [ { "subject_id": "acme-ceo", "total_sec": 16.4, ... } ] }`

### `delete` — remove a subject
`-F action=delete -F subject_id=acme-ceo` → `{ "ok": true, "deleted": "acme-ceo" }`

## Verdicts

| verdict | meaning |
|---------|---------|
| `likely_same_person` | the voice matches the enrolled print (with a **clone caution** — see below) |
| `likely_different_person` | the voice does **not** match — treat as a different speaker |
| `inconclusive` | not enough clean audio to decide (give ~3s+); we abstain rather than guess |
| `not_enrolled` | no voiceprint for that `subject_id` yet — call `enroll` first |

`confidence_band` is `high` / `medium` / `low` from the margin to the threshold.

## The honesty rail (why a match is not proof)

A voiceprint match is **supporting evidence, not proof of a live, genuine human.** In our own
targeted-clone testing, a clone of an enrolled person was accepted **~63% of the time** at the
default threshold — and no single threshold cleanly separates a clone of you from you. So:

- Use `likely_same_person` to *reduce* suspicion, and `likely_different_person` as a real **red flag**.
- For high-stakes actions (payments, password resets, access), **combine** this with an identity
  check (who the contact is) and a **liveness / challenge-response** step. Voice alone is one signal
  in a fusion, never the whole decision.
- Voiceprints are biometric data — enrol only with the subject's consent and in line with applicable
  law (GDPR/BIPA etc.).

## Errors

`{ "ok": false, "reason": "..." }` with an HTTP status: `missing_api_key` / `invalid_api_key` (401),
`missing_subject_id` / `no_audio` (400), `too_large` (413), `engine_error` (502). Rate limit: 120
requests/minute per key.

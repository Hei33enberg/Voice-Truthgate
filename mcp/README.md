# Voice Truthgate — MCP server

Give any AI agent an honest "is this really my contact, on this call?" check. This MCP server
wraps the [Voice Truthgate market API](../docs/VOICE-TRUTHGATE-API.md) as three tools:

| tool | what it does |
|------|--------------|
| `voice_truthgate_enroll` | enrol a subject's voiceprint from 1+ clean clips (consent required) |
| `voice_truthgate_verify` | verify a clip against a subject → honest verdict + confidence + clone caution |
| `voice_truthgate_list_subjects` | list the subjects enrolled under your key |

The engine key and the biometric never touch this process — it only forwards your customer
`X-API-Key`.

## Configure (Claude Desktop / any MCP client)

```json
{
  "mcpServers": {
    "voice-truthgate": {
      "command": "npx",
      "args": ["-y", "@mosadd/voice-truthgate-mcp"],
      "env": { "VTG_API_KEY": "vtg_live_your_key_here" }
    }
  }
}
```

Optional `VTG_API_URL` overrides the endpoint (defaults to the hosted API). Needs Node ≥ 20.

## Example agent turn

> "Verify the caller against subject `acme-ceo` — the clip is at `/tmp/call.wav`."

The agent calls `voice_truthgate_verify({ subject_id: "acme-ceo", audio_path: "/tmp/call.wav" })`
and gets back e.g.:

```json
{ "verdict": "likely_same_person", "score": 0.81, "confidence_band": "high",
  "synthetic_caution": true, "synthetic_note": "A cloned/synthetic voice can also produce this match ..." }
```

## Honesty rail (read this)

A match is a **supporting signal, not proof of a live human** — in our own testing a targeted clone
of an enrolled person was accepted ~63% of the time. For high-stakes actions (payments, access),
combine this with an identity check and a liveness/challenge step. Voiceprints are biometric data;
enrol only with the subject's consent and in line with applicable law.

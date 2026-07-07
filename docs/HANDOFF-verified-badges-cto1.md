# Handoff (CTO-1): "verified-human / verified-agent" badges

A small, high-signal UI feature that leverages something **only mosADD has**: we know at the identity
layer whether a contact is a registered **agent** (`identities.kind = 'agent'`) or a **human**. Standalone
detectors can only say "this audio is AI"; we can say "a contact posing as human is using a synthetic
voice" — the moat from the impersonation design.

**This is CTO-1's lane** (Sphere/chat UI). CTO-2 built the pure logic already; this doc is the wiring
spec. **CTO-2 will not touch Sphere files** (founder-sensitive UI scope).

## The logic already exists (no new brain needed)
- `packages/voice-truthgate-sdk/src/liveAuthenticity.ts` → `assessLiveAuthenticity()` returns the graded
  state to render: `AGENT_EXPECTED` (suppress — a bot voice is expected), `LIKELY_GENUINE` (hedged green),
  `VERIFY_IDENTITY` (voice ≠ enrolled print), `LIVE_BOT_SUSPECTED` (machine rhythm — stays sealed until
  L3 is calibrated), `HEIGHTENED_CAUTION`, `INCONCLUSIVE`, `NO_BADGE`.
- `packages/voice-truthgate-sdk/src/impersonation.ts` → `fuseImpersonation()` is the older, message-level
  variant with the same rails.

## What a badge should show (rails, non-negotiable)
- **Identity-first.** A registered agent's synthetic voice → **no alarm** (AGENT_EXPECTED). This is the
  key move that kills the false-alarm-on-bots problem.
- **Never auto-accuse a known human.** Only the *identity-specific* mismatch (`VERIFY_IDENTITY`) may warn,
  and only on an explicit user tap ("Check this voice") — never an ambient red flag on a real contact.
- **Positive is hedged.** `LIKELY_GENUINE` = "no red flags", never "proven human".
- **Abstain generously.** Short/low-quality clip → `INCONCLUSIVE`, show nothing actionable.
- Every surfaced result carries the disclaimer; copy lives behind i18n keys (human-reviewed).

## Wiring (CTO-1)
- The badge belongs next to the encryption badge on a **persisted voice message** (`SphereVoicePlayer`),
  not on live calls v1 and not on PTT (that's metadata, not audio). Resolve trust from
  `msg.sender_identity_id` (agent vs human) + the voiceprint check.
- CTO-1's job is a **one-line mount** of a NEW badge component (CTO-2 provides it) — do not put logic in
  Sphere. Confirm `contact_metadata` RLS is owner-scoped and add the consent line before it ships.

## Not now
`LIVE_BOT_SUSPECTED` must stay dormant until L3 rhythm is calibrated on real captured voice turns
(`voice_turn_events`, currently empty). The badge should simply never render that state until then.

# @mosadd/threat-engine

Small, dependency-free primitives for **deterministic threat scoring** and severity/action
mapping. It's a shared building block of [`@mosadd/detection-sdk`](../detection-sdk) — most
importantly it defines the `ThreatSeverity` type that Voice Truthgate's confidence bands use.

**License:** MIT.

## What's in it

- `ThreatSeverity` — `"low" | "medium" | "high" | "critical"` (the shared severity scale).
- `computeThreatScore(signals)` → `{ score, severity, reasons }` — a pure, deterministic
  weighted score over a list of signals.
- `buildThreatDecision(score)` → `{ score, actions }` — maps a severity to a suggested set
  of actions.
- Browser adapters + guards for gathering environment signals (optional, tree-shakeable).

```ts
import { computeThreatScore, buildThreatDecision } from "@mosadd/threat-engine";

const score = computeThreatScore([
  { type: "network_packet_loss", value: 70, weight: 1 },
  { type: "recording_detected", value: 90, weight: 1 },
]);
const decision = buildThreatDecision(score); // { score, actions: [...] }
```

Everything here is deterministic and side-effect-free (the browser adapters only read
environment state) — safe to run in the browser, on the edge, or in Node.

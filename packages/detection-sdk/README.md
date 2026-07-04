# @mosadd/detection-sdk

A tiny, pluggable detection pipeline. Defines the `Detector`, `Signal` and `Verdict`
interfaces plus a `runDetectors` runner with **fail-open** semantics. It's the frame
[`@mosadd/voice-truthgate`](../voice-truthgate) plugs its detectors into — but it's detector-agnostic,
so you can build any classifier pipeline on it (voice, text, anomaly, watermark, …).

**License:** MIT. See `LICENSE` in this package.

## Why fail-open is the default

`runDetectors` defaults to `failOpen: true`. A detector that throws, times out, or
returns garbage **must not block the host application**. A buggy or slow model should
degrade the result to "unknown", never crash or hang the app around it. Set
`failOpen: false` only in tests, where you *want* a bad detector to fail loudly.

## Minimal usage

```ts
import { runDetectors, createNoopDetector } from "@mosadd/detection-sdk";

const detectors = [
  createNoopDetector("voice_deepfake"),
  createNoopDetector("phishing_text"),
];

const result = await runDetectors(detectors, { payload: utterance });
if (result.top && result.top.confidence > 0.7) {
  // route to a review queue — the pipeline never decides for you
}
```

## Implementing a Detector

```ts
import type { Detector } from "@mosadd/detection-sdk";

export const voiceDeepfakeDetector: Detector = {
  meta: {
    id: "your-model-v1",
    kind: "voice_deepfake",
    version: "1.0.0",
    modelHash: "sha256:...",
    supportedEnvironments: ["mobile", "edge"],
    local: true,
  },
  canHandle: (input) => input.payload instanceof Float32Array,
  async evaluate(input) {
    const confidence = await runOnnx(input.payload as Float32Array);
    return {
      detectorId: "your-model-v1",
      kind: "voice_deepfake",
      confidence,
      severity: confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low",
      reasons: ["synthetic_voice_probability"],
      emittedAt: Date.now(),
    };
  },
};
```

## Optional telemetry contract

`telemetry.ts` exports a privacy-preserving wire shape (types + pure helpers) you *may*
use to report aggregate detector signals to a backend **you** operate. This package ships
no transport and sends nothing on its own — the types just let a client and its server
type-check one shared payload shape.

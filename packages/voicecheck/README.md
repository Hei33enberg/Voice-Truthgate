# @mosadd/voicecheck

**VoiceCheck by mosADD** — an MIT SDK for **voice-deepfake / synthetic-speech detection**.

> 📖 New here? Read the repo's [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md) for a plain-language
> walkthrough, or try it live at **https://mosadd.com/voicecheck**.

It gives you a two-stage, **honest** signal:

1. **On-device heuristic triage** — instant, private, no model download. A pure-DSP scorer (spectral tilt, ZCR jitter, prosody flatness, breath pauses, F0 variance). A cheap floor, weak on modern TTS — a *triage*, not a verdict.
2. **Server confirmation** *(optional, you inject it)* — a trained anti-spoof model run wherever you deploy it. Authoritative when reachable; **fail-open** if not.

Results are a **confidence band** (`likely-authentic` / `uncertain` / `likely-synthetic`) with a mandatory **"signal, not a verdict"** disclaimer — never a bare true/false. See [`MODEL_CARD.md`](./MODEL_CARD.md).

## Why band-first / signal-not-verdict?
No detector reliably beats ~85% on unseen modern TTS, and codec compression (Opus/MP3/telephony) degrades accuracy 10–40%. A public tool that confidently says "FAKE" and is wrong harms real people. This SDK is built so you **cannot** accidentally surface a bare verdict.

## Usage

```ts
import { analyzeVoiceCheck, createHeuristicDetector, createServerDetector } from "@mosadd/voicecheck";

// Decode your audio to mono PCM first (Float32Array at, e.g., 16 kHz).
const payload = { samples, sampleRate: 16000 };

// On-device only (instant, private):
const quick = await analyzeVoiceCheck(payload);
console.log(quick.band.label, quick.confidence, quick.disclaimer);

// Hybrid (triage + server confirmation). You provide how the server is reached
// (the SDK never hard-codes an endpoint or keys):
const server = createServerDetector({
  analyze: async (p) => callYourModel(p), // → { confidence, modelVersion, reasons? }
  version: "your-model-v1",
});
const full = await analyzeVoiceCheck(payload, { detectors: [createHeuristicDetector(), server] });
// The server verdict wins when it answers; falls back to on-device if it fails.
```

`analyzeVoiceCheck` always returns `{ available, confidence, band, reasons, detectorId, modelVersion, disclaimer, isSignalNotVerdict, verdicts }`. When nothing usable answers, `available` is `false` and the band is `uncertain` — **never** `likely-authentic`.

## Building on the pluggable core
This SDK is built on [`@mosadd/detection-sdk`](../detection-sdk) (`Detector` / `Verdict` / `runDetectors`, fail-open) and [`@mosadd/voice-analyzer-core`](../voice-analyzer-core) (the pure-TS heuristic). Add your own detectors (edge ONNX, watermark check, etc.) and pass them to `analyzeVoiceCheck`.

## License
MIT © mosADD. Use freely, including commercially. Attribution appreciated. If you deploy a third-party server model, keep its own license/attribution.

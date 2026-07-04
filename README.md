<div align="center">

# Voice Truthgate by mosADD

*(formerly VoiceCheck)*

### Is this voice real or AI? Honest, on-device, MIT.

[![CI](https://github.com/Hei33enberg/voice-truthgate/actions/workflows/ci.yml/badge.svg)](https://github.com/Hei33enberg/voice-truthgate/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](./LICENSE)
[![Privacy: on-device](https://img.shields.io/badge/privacy-on--device-brightgreen.svg)](#privacy--on-device-by-design)
[![Try it live](https://img.shields.io/badge/try%20it-live-8A2BE2.svg)](https://mosadd.com/voice-truthgate)

A small, honest toolkit for **voice-deepfake / synthetic-speech detection** that runs
**in the browser** — your audio never leaves your device. It never gives you a bare
"REAL / FAKE". It gives you a **confidence band** and a plain disclaimer, because
getting this wrong about a real person is harmful.

**[▶ Try it live at mosadd.com/voice-truthgate](https://mosadd.com/voice-truthgate)** &nbsp;·&nbsp;
[How it works](https://mosadd.com/voice-truthgate/how-it-works) &nbsp;·&nbsp;
[Model card](https://mosadd.com/model-card)

</div>

---

## Why this exists

The whole voice-AI industry races to **generate** speech; almost nobody ships a good,
free tool to **detect** it. Voice Truthgate is that tool — and it's deliberately built to be
*honest* about its own limits rather than confidently wrong.

- 🔒 **On-device.** Both checks run in your browser. There's no account and no server in
  the loop for the public checker — the tool has nowhere to send your audio.
- 🎚️ **A band, never a verdict.** Results are one of three confidence bands, always shown
  with a "signal, not a verdict" disclaimer. You *cannot* accidentally surface a bare
  boolean.
- 📖 **MIT + open.** Four small, reusable packages. Use them commercially, fork them,
  build your own detectors on the pipeline.

## 60-second quickstart

```ts
import { analyzeVoiceTruthgate } from "@mosadd/voice-truthgate";

// Decode your audio to mono PCM (a Float32Array), e.g. at 16 kHz.
const result = await analyzeVoiceTruthgate({ samples, sampleRate: 16000 });

console.log(result.band.label);  // "Likely authentic" | "Uncertain" | "Likely synthetic"
console.log(result.confidence);  // 0..1 — lead with the band, not this number
console.log(result.disclaimer);  // ALWAYS present — render it next to the result
```

Want the trained model to weigh in too? Pass an injectable server detector — the SDK
never hard-codes an endpoint or keys, and it **fails open** (if the model is unreachable,
the on-device band still stands, and never silently becomes "authentic"):

```ts
import { analyzeVoiceTruthgate, createHeuristicDetector, createServerDetector } from "@mosadd/voice-truthgate";

const server = createServerDetector({
  analyze: async (payload) => callYourModel(payload), // → { confidence, modelVersion }
  version: "your-model-v1",
});

const result = await analyzeVoiceTruthgate(
  { samples, sampleRate: 16000 },
  { detectors: [createHeuristicDetector(), server] },
);
```

> **Note:** publishing to npm is pending (see the roadmap). For now, use these packages by
> cloning this repo (`npm install` sets up the workspaces), or by vendoring `packages/*`.
> Try the runnable demo with **`npm run example`**, or open `examples/browser-check` for a
> mic/file UI.

## The three confidence bands

| Band | Score | What it means |
|---|---|---|
| 🟢 **Likely authentic** | `0.00 – 0.35` | No strong synthetic-voice signals found. This does **NOT** prove the voice is real — a good deepfake can score here. |
| 🟡 **Uncertain** | `0.35 – 0.65` | Mixed or weak signals. Treat as inconclusive; a longer, uncompressed sample and human review are recommended. |
| 🔴 **Likely synthetic** | `0.65 – 1.00` | Signals consistent with AI-generated or cloned speech. This is **NOT** proof — verify with a human expert before acting. |

Every result carries this disclaimer, verbatim:

> **This is a signal, not a verdict.** Automated voice-authenticity detection is
> probabilistic and can be wrong in both directions. Do not use this result alone to
> accuse, identify, or make legal/forensic decisions about a person.

## Architecture

Two stages, both **on-device**. An optional trained model is *injected* by the host app —
the SDK stays infrastructure-free.

```
        ┌──────────────── your device / browser (nothing leaves it) ────────────────┐
        │                                                                            │
 mic /  │  record or      decode to        STAGE 1: instant heuristic                │
 file ──┼─▶ upload  ─────▶ 16 kHz mono ───▶ (pure DSP, 0 MB, default)  ──────────────┼──▶  confidence
        │                  Float32 PCM   │                                           │     BAND
        │                                └▶ STAGE 2: stronger model (opt-in) ─────────┼──▶  +
        │                                   (a real classifier via transformers.js)  │     disclaimer
        │                                                                            │
        └────────────────────────────────────────────────────────────────────────── ┘
                                              │
                     (optional) injected SERVER detector — your model, your transport;
                      authoritative when it answers, FAIL-OPEN when it doesn't.
```

- **Stage 1 — heuristic triage** (`@mosadd/voice-analyzer-core`): instant, private, no
  download. Pure-DSP cues (spectral tilt, ZCR jitter, prosody flatness, breath pauses, F0
  variance). A cheap floor, weak on modern TTS — a triage, not a verdict.
- **Stage 2 — a real model, opt-in, still on-device** (`examples/browser-check`): a trained
  wav2vec2 audio classifier run **in the browser** via `@huggingface/transformers`. When it
  answers, its verdict is authoritative.
- **Fusion is band-first and fails to "unknown", never to "safe".** When nothing usable
  answers, the result is `available: false` with band `uncertain` — never `likely-authentic`.

## Packages

| Package | Role |
|---|---|
| [`@mosadd/voice-truthgate`](./packages/voice-truthgate) | The brains — fuses the stages into an honest band and always attaches the disclaimer. |
| [`@mosadd/voice-analyzer-core`](./packages/voice-analyzer-core) | Stage 1: the instant, pure-DSP on-device heuristic. |
| [`@mosadd/detection-sdk`](./packages/detection-sdk) | Pluggable `Detector` / `Verdict` frame + fail-open `runDetectors`. |
| [`@mosadd/threat-engine`](./packages/threat-engine) | Shared severity/scoring primitives (transitive dependency). |

## Honesty — the caveats, stated plainly

This is a **signal**, and we want you to know exactly what it is and isn't:

- **Accuracy is not yet benchmarked** on real human-vs-cloned voice pairs. Treat current
  behavior as a demonstrator, not a measured system.
- **The field has a ceiling.** No open detector reliably beats roughly **~85% on unseen,
  modern premium TTS** (e.g. the latest ElevenLabs). That number is a rough field ceiling
  for framing — **not** a spec or a claim about this tool. False negatives happen.
- **Codec compression is the #1 accuracy killer** (Opus / MP3 / telephony, −10–40%). Real
  phone / VPN / Zoom audio is compressed. Prefer uploaded, less-compressed clips.
- **The opt-in Stage-2 model is large** — ~379 MB, unquantized (downloaded once, then
  cached). Shrinking it is on the roadmap.
- **Short, noisy, or distressed real speech** raises false positives; accuracy varies by
  language and accent.
- **npm publish is pending.** Packages are made publish-*ready*; they are not on npm yet.
- **Not for accusations, forensics, or legal decisions.** See each package's `MODEL_CARD.md`.

## Privacy — on-device by design

The public checker has nowhere to send your audio: Stage 1 and the opt-in Stage 2 both run
locally. The SDK ships **no** transport and **no** endpoint. A server model is something you
*inject* — and even then, Voice Truthgate sends nothing on its own.

## Why mosADD built this

mosADD is building an agent-to-agent messenger where knowing whether a voice is a person or
a synthetic is a real safety question. Voice Truthgate is the open, honest, public face of that
work — a useful utility that reflects what mosADD stands for: **privacy and honesty**. Learn
more at **[mosadd.com](https://mosadd.com)**.

## Roadmap

- [ ] Benchmark accuracy on real ElevenLabs-vs-human pairs (the gate before any accuracy claim)
- [ ] Quantize the Stage-2 model (~379 MB → ~95 MB)
- [ ] Publish the packages to npm as `@mosadd/*`
- [ ] Optional hosted "stronger check" for heavier accuracy (fail-open, stores no audio)

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md). Please keep the honesty rails intact (no bare
verdicts, keep the disclaimer, no accuracy claims). Security reports:
[SECURITY.md](./SECURITY.md).

## License

[MIT](./LICENSE) © mosADD. Third-party attributions (transformers.js, the referenced
Hugging Face model) are in [NOTICE](./NOTICE).

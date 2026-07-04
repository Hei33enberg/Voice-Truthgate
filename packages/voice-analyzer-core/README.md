# @mosadd/voice-analyzer-core

Pure-TypeScript, deterministic voice-deepfake **feature extractor + heuristic scorer**.
No DOM, no Web Audio, no FFT library — it runs identically in the browser, React Native,
edge runtimes and Node. It's Stage 1 (the instant, on-device triage) of
[`@mosadd/voicecheck`](../voicecheck).

**License:** MIT.

## Why this exists

The same scoring function has to run in several different runtimes without ever
diverging — in a browser tab, on the edge, in a Node test. If the score drifted between
where it's computed and where it's shown, one place could read "0.91 synthetic" while
another shows "0.06 fine" for the exact same audio. This package is the single,
deterministic source of that score.

It is a **heuristic**, not a trained anti-spoof model: a fast, transparent triage floor.
For an authoritative verdict, pair it with a trained model via `@mosadd/voicecheck`'s
injectable server detector.

## API

```ts
import { analyzeAudio } from "@mosadd/voice-analyzer-core";

const result = analyzeAudio(pcmSamples, 16000);
// {
//   confidence: 0.87,
//   verdict: "VOICE_DEEPFAKE_HIGH_CONFIDENCE",
//   features: { spectralTiltStdDev: 0.05, zcrJitter: 0.002, ... },
//   topReasons: ["heuristic_score=0.87", "prosody_flatness=0.92", ...],
//   analyzerVersion: "heuristic-1.0"
// }
```

## Scoring heuristic

The scorer (version `heuristic-1.0`) weights five cues:

| Cue | Weight | What it measures |
|-----|--------|------------------|
| `prosodyFlatness` | 0.28 | Flat energy envelope = unnatural |
| `zcrLowJitter` | 0.22 | Synthetic voices have unnaturally smooth ZCR |
| `spectralTiltLowVariance` | 0.18 | Real speech tilt wanders, synth holds steady |
| `noBreathPauses` | 0.18 | Real voice has breaths between phrases; synth doesn't |
| `f0LowVariance` | 0.14 | Monotone pitch curve |

All five cues are deterministic time-domain or narrow-band-Goertzel measures — no FFT
library, no model file. It is intentionally simple and honest about being a heuristic.

## Synthesizers

For offline, reproducible demos and tests we ship three signal synthesizers
(**NOT** real recordings — synthetic audio with known feature distributions):

- `synthesizeHumanPolish(seed)` — varied F0, natural ZCR jitter, embedded breath pauses,
  dynamic envelope.
- `synthesizeElevenLabsLikeSynth(seed)` — uniform F0, near-zero ZCR jitter, zero breaths,
  flat envelope.
- `synthesizeVoiceCloneChild(seed)` — child-pitch, synthetically smooth.

Feed any `Float32Array` of mono PCM to `analyzeAudio()` — the function does not care where
the audio came from.

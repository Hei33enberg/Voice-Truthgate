# VoiceCheck — how it's built

A plain-language reference for **VoiceCheck**, the free "is this voice real or AI?" checker.
Written so you can understand the whole thing **without reading the code**. Engineers: the
package/file map and "how to run & verify" sections at the bottom are for you.

---

## 1. What it is (in one paragraph)

AI can clone a human voice from a few seconds of audio. The whole voice-AI industry races
to *generate* speech — almost nobody ships a good, free tool to *detect* it. VoiceCheck is
that tool. You record or upload a short clip and it tells you, honestly, whether the voice
shows signs of being AI-generated. It's free, needs no account, and — the important part —
**the audio never leaves your device**.

Try it live: **https://mosadd.com/voicecheck** (with a plain-language explainer at
`/voicecheck/how-it-works` and the honest limitations page at `/model-card`).

---

## 2. The big picture

```
        ┌──────────────────────── your browser (nothing leaves it) ─────────────────────────┐
        │                                                                                    │
  mic / │   record or                 decode to                                              │
  file ─┼─▶  upload a clip  ─────────▶ 16 kHz mono ──┬──▶  STAGE 1: instant check  ──────────┼──▶  confidence
        │                             (Float32 PCM)  │     (math-based, 0 MB, default)        │     BAND +
        │                                            │                                        │     disclaimer
        │                                            └──▶  STAGE 2: stronger AI check ─────────┼──▶ (authoritative
        │                                                  (real model, opt-in, ~379 MB once) │      when it runs)
        │                                                                                     │
        └─────────────────────────────────────────────────────────────────────────────────── ┘

        (optional, off by default: an explicit opt-in could also confirm a clip against a
         heavier model on a server, via a privacy proxy that stores no audio — see §7.)
```

Two checks, both **inside the browser**. The first is instant; the second is stronger but
optional. The result is always one of three honest **bands**, never a bare "REAL/FAKE".

---

## 3. Stage 1 — the instant check (default)

- **What it is:** a lightweight, math-based ("DSP") analysis of the sound itself — how the
  pitch moves over time, how breathing pauses fall, how the spectral tone is shaped, jitter,
  etc. No AI model, no download.
- **Why it exists:** it's *immediate* and gives a zero-cost floor. It's deliberately a
  **first-pass triage** — it can miss a high-quality modern fake, so we never present it as
  the final word.
- **Where it lives:** [`@mosadd/voice-analyzer-core`](../packages/voice-analyzer-core)
  (pure TypeScript), wrapped as a "detector" the pipeline can run.

## 4. Stage 2 — the stronger AI check (opt-in, still on-device)

- **What it is:** a **real trained AI model** — `as1605/Deepfake-audio-detection-V2` (a
  wav2vec2 speech model trained on many real-vs-synthetic examples). When it answers, its
  verdict is the **authoritative** one and can correct a wrong guess from Stage 1.
- **How it runs:** you tap *"Run the stronger AI check."* The model downloads **once**
  (~379 MB, then cached by the browser) and runs **inside your browser** using
  [`@huggingface/transformers`](https://github.com/huggingface/transformers.js). No server,
  no cost, no data sent.
- **Why on-device and not a server?** Running the real model in the browser gives a credible
  model at **zero server cost and zero data exposure** — which also fits the privacy story.
  (A hosted path still exists as an option for later — see §7.)
- **Where it lives:** [`examples/browser-check`](../examples/browser-check) shows the pattern
  end-to-end (decode → instant band → opt-in model → authoritative band).

## 5. Privacy — the audio never leaves your device

Both checks happen entirely in your browser. Nothing is uploaded, stored, or transmitted —
there's no account and no server in the loop for the public checker. This isn't a toggle you
can flip the wrong way; the tool simply **has nowhere to send your audio**. The SDK ships no
transport and no endpoint.

## 6. Honesty — a band, never a verdict

A raw percentage would imply false precision on a genuinely uncertain problem. So a single
place in the code ([`confidenceBands.ts`](../packages/voicecheck/src/confidenceBands.ts))
turns the model's 0–1 score into **one of three bands**, and every result is shown with the
same disclaimer:

| Band | Meaning |
|---|---|
| 🟢 **Likely authentic** | No strong synthetic signals found. **Not proof** — a good deepfake can score here. |
| 🟡 **Uncertain** | Mixed / weak signals. Inconclusive — a longer, cleaner clip + human review recommended. |
| 🔴 **Likely synthetic** | Signals consistent with AI/cloned speech. **Not proof** — verify with an expert. |

> **This is a signal, not a verdict.** Automated voice-authenticity detection is
> probabilistic and can be wrong in both directions. Do not use this result alone to accuse,
> identify, or make legal/forensic decisions about a person.

This is a hard requirement, not polish: a public detector that confidently says "FAKE" and
is wrong harms real people. The code is structured so you *cannot* accidentally surface a
bare true/false — when nothing usable answers, the result is `available: false` / band
`uncertain`, **never** `likely-authentic`. The tool fails to *unknown*, not to *safe*.

## 7. The optional server check (supported, off by default)

The `@mosadd/voicecheck` pipeline accepts an **injectable** server detector: you supply how
your model is reached (a proxy, an edge function, a direct call — the SDK hard-codes
nothing). It's designed to **fail open**: if the server is down, the on-device band still
stands and never silently becomes "authentic". Until you inject one, everything is 100%
on-device.

---

## 8. What it's built from (the open-source kit)

A small, **MIT-licensed** set of packages — reusable by anyone:

| Package (`@mosadd/*`) | Role |
|---|---|
| [`voicecheck`](../packages/voicecheck) | The brains — turns a clip into a confidence band and always attaches the disclaimer. Fuses Stage 1 + Stage 2 (server wins when it answers; falls back to on-device; never to "authentic"). |
| [`voice-analyzer-core`](../packages/voice-analyzer-core) | The instant math-based check (Stage 1). |
| [`detection-sdk`](../packages/detection-sdk) | A plug-in frame (`Detector` / `Verdict` / `runDetectors`, fail-open) so new detectors can be added without rewrites. |
| [`threat-engine`](../packages/threat-engine) | Shared severity/scoring primitives (transitive dependency). |

## 9. File map (for engineers)

| Concern | File |
|---|---|
| Pipeline / fusion (band-first, fail-open) | `packages/voicecheck/src/pipeline.ts` |
| The ONLY score→band+disclaimer mapping | `packages/voicecheck/src/confidenceBands.ts` |
| Machine-readable model card | `packages/voicecheck/src/modelCard.ts` + `packages/voicecheck/MODEL_CARD.md` |
| Stage-1 detector + injectable server detector | `packages/voicecheck/src/detectors/*` |
| Stage-1 DSP feature extraction + scorer | `packages/voice-analyzer-core/src/{extract,score}.ts` |
| Deterministic sample synthesizers (for demos/tests) | `packages/voice-analyzer-core/src/synthesize.ts` |
| Detector/Verdict pipeline + fail-open runner | `packages/detection-sdk/src/{pipeline,types}.ts` |
| Runnable Node demo / CI smoke test | `examples/node-quickcheck/index.ts` |
| Browser mic/file demo (Stage 1 + opt-in Stage 2) | `examples/browser-check/` |

## 10. How to run & verify

Requires Node 20+.

```bash
npm install          # set up the workspaces
npm run typecheck    # tsc --noEmit across all packages
npm test             # vitest across all packages
npm run example      # deterministic Node quick-check (human → green-ish, synthetic → red-ish)
```

- **`npm run example`** synthesizes a human-like and a synthetic-like clip and prints their
  bands. It also asserts the synthetic clip scores higher and that the disclaimer is present,
  so CI fails on a regression.
- **Browser demo:** `cd examples/browser-check && npm install && npm run dev`, then record or
  upload a clip. The opt-in "stronger check" downloads the model on first use.

## 11. What is NOT done yet (open decisions)

1. **Accuracy on real samples.** Stage 2 loads and classifies, but hasn't been benchmarked on
   real human-vs-cloned pairs. That measurement is the gate before promoting accuracy.
2. **Model size.** ~379 MB is large even for an opt-in download; worth quantizing to ~95 MB.
3. **npm publish.** The packages are MIT and publish-ready, but not yet on npm.
4. **Legal review** of the disclaimer / ToS before any broad public promotion.

## 12. Licensing

MIT © mosADD for the VoiceCheck packages — free to use, including commercially; attribution
appreciated. Third-party attributions are in [`NOTICE`](../NOTICE).

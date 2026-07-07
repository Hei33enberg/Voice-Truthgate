# Proposal: 8 kHz telephony fine-tune for L1 (voiceprint)

**Why:** the phone is the actual fraud channel (vishing), and 8 kHz G.711 is where our voiceprint is
weakest. Our own L1 numbers: ECAPA + enrollment reaches ~4.6% EER on clean audio but ~10.4% at phone
8 kHz — the codec cliff is the single biggest accuracy gap for the real attack surface.

**Scope (a real experiment, greenlight-gated — bigger than a bench run):**
1. Build a telephony-degraded enrollment/eval set: pass our existing speaker sets through G.711 μ-law +
   AMR-NB + Opus-narrowband (the codecs real calls use). Tooling already exists in
   `tools/voice-truthgate-bench` (ffmpeg codec matrix).
2. Two paths, cheapest first:
   - **(a) Calibration layer** — per-codec score normalisation / threshold on the *existing* ECAPA
     embeddings (no retraining). Often recovers a large chunk of the cliff for near-zero cost.
   - **(b) Fine-tune / adapter** — fine-tune ECAPA (or train a small projection head) on 8 kHz-degraded
     data. Heavier: needs a GPU box + a labelled multi-speaker telephony set.
3. Accept gate: 8 kHz EER < 6% without pushing clean-audio FAR up.

**Cost/risk:** (a) is a day on the existing box. (b) needs GPU time + a telephony corpus (there are
public ones; licensing to check) and is the "if (a) isn't enough" step. Both stay honest — a better L1 is
still *one* fused signal, never a standalone verdict.

**Recommendation:** do (a) first (cheap, likely-sufficient); only escalate to (b) if the calibration
layer doesn't clear the gate. Owner greenlight needed before (b) (GPU spend).

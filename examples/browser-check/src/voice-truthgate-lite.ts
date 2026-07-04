/**
 * voice-truthgate-lite — a tiny, SELF-CONTAINED illustration of the Voice Truthgate
 * band-first output, so this example runs with zero setup.
 *
 * The bands + disclaimer below are kept identical to the real package
 * (@mosadd/voice-truthgate → confidenceBands.ts). In a real app, import them from
 * @mosadd/voice-truthgate instead of copying — this copy exists only so the example
 * has no dependency on the (not-yet-published) workspace packages.
 *
 * The `heuristicScore` here is a deliberately minimal stand-in for
 * @mosadd/voice-analyzer-core. It is NOT the real DSP heuristic — it's just
 * enough to show the "instant band" step. Do not judge accuracy by it.
 */

export const SIGNAL_NOT_VERDICT_DISCLAIMER =
  "This is a signal, not a verdict. Automated voice-authenticity detection is " +
  "probabilistic and can be wrong in both directions. Do not use this result " +
  "alone to accuse, identify, or make legal/forensic decisions about a person.";

export type BandId = "likely-authentic" | "uncertain" | "likely-synthetic";

export interface Band {
  id: BandId;
  label: string;
  description: string;
  emoji: string;
  min: number;
  max: number;
}

export const BANDS: readonly Band[] = [
  {
    id: "likely-authentic",
    label: "Likely authentic",
    emoji: "🟢",
    description:
      "No strong synthetic-voice signals found. This does NOT prove the voice is real — a good deepfake can score here.",
    min: 0,
    max: 0.35,
  },
  {
    id: "uncertain",
    label: "Uncertain",
    emoji: "🟡",
    description:
      "Mixed or weak signals. Treat as inconclusive; a longer, uncompressed sample and human review are recommended.",
    min: 0.35,
    max: 0.65,
  },
  {
    id: "likely-synthetic",
    label: "Likely synthetic",
    emoji: "🔴",
    description:
      "Signals consistent with AI-generated or cloned speech. This is NOT proof — verify with a human expert before acting.",
    min: 0.65,
    max: 1.0001,
  },
] as const;

export function bandForConfidence(confidence: number): Band {
  const c = Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0;
  return BANDS.find((b) => c >= b.min && c < b.max) ?? BANDS[BANDS.length - 1];
}

/**
 * Minimal illustrative heuristic: measures how "flat" the energy envelope is
 * and how little the zero-crossing rate jitters — both loosely correlate with
 * synthetic voices. Returns a rough 0..1 "looks synthetic" score.
 *
 * This is a teaching stand-in, NOT the production heuristic. See
 * @mosadd/voice-analyzer-core for the real one.
 */
export function heuristicScore(samples: Float32Array, sampleRate: number): number {
  if (!samples || samples.length < sampleRate * 0.5) return 0.5; // too short → uncertain-ish

  const frame = Math.max(256, Math.floor(sampleRate * 0.032)); // ~32 ms
  const energies: number[] = [];
  const zcrs: number[] = [];

  for (let start = 0; start + frame <= samples.length; start += frame) {
    let energy = 0;
    let crossings = 0;
    let prev = samples[start];
    for (let i = start; i < start + frame; i++) {
      const s = samples[i];
      energy += s * s;
      if ((s >= 0 && prev < 0) || (s < 0 && prev >= 0)) crossings++;
      prev = s;
    }
    energies.push(Math.sqrt(energy / frame));
    zcrs.push(crossings / frame);
  }
  if (energies.length < 3) return 0.5;

  const flatness = 1 - coefficientOfVariation(energies); // flat envelope → closer to 1
  const zcrSteadiness = 1 - coefficientOfVariation(zcrs); // steady ZCR → closer to 1

  // Weight envelope flatness a bit more, like the real heuristic favors prosody.
  const raw = 0.6 * clamp01(flatness) + 0.4 * clamp01(zcrSteadiness);
  return clamp01(raw);
}

function coefficientOfVariation(xs: number[]): number {
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  if (mean === 0) return 1;
  const variance = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / xs.length;
  return Math.sqrt(variance) / mean;
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  return Math.min(1, Math.max(0, x));
}

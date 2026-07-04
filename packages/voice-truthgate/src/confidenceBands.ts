import type { ConfidenceBand } from "./types";

/**
 * The mandatory disclaimer. Detection is probabilistic and imperfect — modern
 * TTS can pass, and real (compressed / noisy / distressed) speech can trip the
 * detector. This string MUST be rendered next to every Voice Truthgate result and
 * returned by every API response. See MODEL_CARD.md.
 */
export const SIGNAL_NOT_VERDICT_DISCLAIMER =
  "This is a signal, not a verdict. Automated voice-authenticity detection is " +
  "probabilistic and can be wrong in both directions. Do not use this result " +
  "alone to accuse, identify, or make legal/forensic decisions about a person.";

/**
 * The ONLY place a raw 0..1 score becomes a user-facing band. Three bands only,
 * on purpose — a coarse, honest signal beats a false-precision percentage.
 */
export const CONFIDENCE_BANDS: readonly ConfidenceBand[] = [
  {
    id: "likely-authentic",
    label: "Likely authentic",
    description:
      "No strong synthetic-voice signals found. This does NOT prove the voice is real — a good deepfake can score here.",
    severity: "low",
    min: 0,
    max: 0.35,
  },
  {
    id: "uncertain",
    label: "Uncertain",
    description:
      "Mixed or weak signals. Treat as inconclusive; a longer, uncompressed sample and human review are recommended.",
    severity: "medium",
    min: 0.35,
    max: 0.65,
  },
  {
    id: "likely-synthetic",
    label: "Likely synthetic",
    description:
      "Signals consistent with AI-generated or cloned speech. This is NOT proof — verify with a human expert before acting.",
    severity: "high",
    min: 0.65,
    max: 1.0001, // inclusive of 1.0
  },
] as const;

/** Map a 0..1 confidence to its band. Clamps out-of-range inputs. */
export function bandForConfidence(confidence: number): ConfidenceBand {
  const c = Number.isFinite(confidence) ? Math.min(1, Math.max(0, confidence)) : 0;
  return (
    CONFIDENCE_BANDS.find((b) => c >= b.min && c < b.max) ??
    CONFIDENCE_BANDS[CONFIDENCE_BANDS.length - 1]!
  );
}

/** The band to use when no verdict is available (never "likely-authentic"). */
export function unavailableBand(): ConfidenceBand {
  return CONFIDENCE_BANDS.find((b) => b.id === "uncertain")!;
}

// =============================================================================
// Heuristic scorer — deterministic, pure functions, no model weights.
//
// This scorer encodes the cues we *do* trust: spectral tilt stability, ZCR
// jitter, prosody flatness, breath pauses, F0 variance. It is a triage floor,
// not a trained anti-spoof model.
//
// Common synthetic voices (e.g. ElevenLabs, Bark, Coqui) tend to fail on
// breath pauses + prosody flatness — those weights are intentionally
// dominant.
// =============================================================================

import type { VoiceAnalysisResult, VoiceFeatureBundle, VoiceVerdict } from "./types";

export const ANALYZER_VERSION = "heuristic-1.0";

/** Score weights. Sum doesn't need to be 1 — final score is normalised below. */
const WEIGHTS = {
  spectralTiltLowVariance: 0.18,   // synth voices have unnaturally stable tilt
  zcrLowJitter: 0.22,              // synth voices often have unnaturally smooth ZCR
  prosodyFlatness: 0.28,           // dominant — flat prosody is the clearest tell
  noBreathPauses: 0.18,            // synth voices skip realistic breaths
  f0LowVariance: 0.14,             // monotone pitch curve
} as const;

/** Maps raw feature → 0..1 "this looks synthetic" sub-score. */
function partialScores(features: VoiceFeatureBundle): Record<keyof typeof WEIGHTS, number> {
  // Each sub-score: 0 = looks human, 1 = looks synthetic.
  // Thresholds are heuristic, calibrated by hand against ASVspoof + ElevenLabs PL samples.

  // Real speech tilt stddev ≈ 0.3..0.8. Synth ≈ 0..0.15.
  const tiltLowVariance = clamp01(1 - features.spectralTiltStdDev / 0.4);

  // Real ZCR jitter ≈ 0.01..0.05. Synth ≈ 0..0.008.
  const zcrLowJitter = clamp01(1 - features.zcrJitter / 0.02);

  // prosodyFlatness already 0..1, 1 = fully flat.
  const prosodyFlat = clamp01(features.prosodyFlatness);

  // Real voice usually has 1-3 breath pauses per 5s window. Synth: 0.
  const noBreaths = features.breathPauseCount === 0 ? 1 : clamp01(1 - features.breathPauseCount / 2);

  // Real F0 stddev ≈ 20..60 Hz across an utterance. Synth ≈ 0..15 Hz.
  const f0Low = clamp01(1 - features.f0StdDev / 25);

  return {
    spectralTiltLowVariance: tiltLowVariance,
    zcrLowJitter,
    prosodyFlatness: prosodyFlat,
    noBreathPauses: noBreaths,
    f0LowVariance: f0Low,
  };
}

function clamp01(x: number): number {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function classify(confidence: number): VoiceVerdict {
  if (confidence >= 0.85) return "VOICE_DEEPFAKE_HIGH_CONFIDENCE";
  if (confidence >= 0.55) return "VOICE_DEEPFAKE_OBSERVED";
  return "VOICE_ANALYSIS_NOMINAL";
}

/**
 * Score a feature bundle. Pure, deterministic, no allocation of large arrays.
 * Returns a VoiceAnalysisResult.
 */
export function scoreFeatures(features: VoiceFeatureBundle): VoiceAnalysisResult {
  const parts = partialScores(features);
  const totalWeight = Object.values(WEIGHTS).reduce((s, w) => s + w, 0);
  const confidenceRaw =
    parts.spectralTiltLowVariance * WEIGHTS.spectralTiltLowVariance +
    parts.zcrLowJitter            * WEIGHTS.zcrLowJitter +
    parts.prosodyFlatness         * WEIGHTS.prosodyFlatness +
    parts.noBreathPauses          * WEIGHTS.noBreathPauses +
    parts.f0LowVariance           * WEIGHTS.f0LowVariance;
  const confidence = clamp01(confidenceRaw / totalWeight);

  // Pick top 3-4 dominant contributors for the XAI panel.
  const contributions: Array<[string, number]> = [
    [`spectral_tilt_variance=${features.spectralTiltStdDev.toFixed(2)}`, parts.spectralTiltLowVariance * WEIGHTS.spectralTiltLowVariance],
    [`zcr_jitter=${features.zcrJitter.toFixed(3)}`, parts.zcrLowJitter * WEIGHTS.zcrLowJitter],
    [`prosody_flatness=${features.prosodyFlatness.toFixed(2)}`, parts.prosodyFlatness * WEIGHTS.prosodyFlatness],
    [`breath_pauses=${features.breathPauseCount}`, parts.noBreathPauses * WEIGHTS.noBreathPauses],
    [`f0_stddev_hz=${features.f0StdDev.toFixed(1)}`, parts.f0LowVariance * WEIGHTS.f0LowVariance],
  ];
  contributions.sort((a, b) => b[1] - a[1]);
  const topReasons = [
    // Honest label: this is a heuristic score, NOT a trained anti-spoof model
    // output. When a trained model is used, its verdict comes from the
    // injectable server detector — never present the heuristic as a trained
    // model. See the model card.
    `heuristic_score=${confidence.toFixed(2)}`,
    ...contributions.slice(0, 3).map((c) => c[0]),
  ];

  return {
    confidence,
    verdict: classify(confidence),
    features,
    topReasons,
    analyzerVersion: ANALYZER_VERSION,
  };
}

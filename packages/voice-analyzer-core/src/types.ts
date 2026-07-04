// =============================================================================
// Public wire shape for the voice-deepfake analyzer.
//
// These types are the stable contract for `analyzeAudio` / `scoreFeatures`.
// The same shapes are produced identically in the browser, on the edge and in
// Node, so a score never diverges between where it is computed and where it is
// displayed.
// =============================================================================

/** Top-level verdict bucket for downstream consumers. */
export type VoiceVerdict =
  | "VOICE_ANALYSIS_NOMINAL"
  | "VOICE_DEEPFAKE_OBSERVED"
  | "VOICE_DEEPFAKE_HIGH_CONFIDENCE";

export interface VoiceFeatureBundle {
  /** Ratio of high-frequency energy to low-frequency energy (mean across frames). Synthetic voice tends to have anomalous tilt. */
  spectralTiltMean: number;
  /** Standard deviation of spectral tilt across frames. Real speech has more variance. */
  spectralTiltStdDev: number;
  /** Mean zero-crossing rate. Synthetic voice often has unnaturally smooth or unnaturally jagged ZCR. */
  zcrMean: number;
  /** ZCR variance / "jitter". Real voice has natural micro-jitter. */
  zcrJitter: number;
  /** Flatness of the energy envelope curve. Closer to 1 = unnaturally smooth = suspicious. */
  prosodyFlatness: number;
  /** Number of "breath" pauses (low-energy frames surrounded by high). 0 in many synth voices. */
  breathPauseCount: number;
  /** Detected fundamental frequency (Hz) — placeholder for full pitch tracking. */
  estimatedF0Hz: number;
  /** F0 standard deviation across frames. Flat pitch curve = suspect. */
  f0StdDev: number;
}

export interface VoiceAnalysisResult {
  /** 0..1 confidence the input is synthetic / deepfake. */
  confidence: number;
  /** Human-grouped verdict for downstream consumers. */
  verdict: VoiceVerdict;
  /** Raw features that drove the verdict (for XAI panel). */
  features: VoiceFeatureBundle;
  /** Top reasons, formatted for human display (e.g. an explainability panel). */
  topReasons: string[];
  /** Identifier of the analyzer build. Bump when scoring weights change. */
  analyzerVersion: string;
}

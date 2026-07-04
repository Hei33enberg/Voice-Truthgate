import type { ThreatSeverity } from "@mosadd/threat-engine";
import type { Verdict } from "@mosadd/detection-sdk";

/**
 * Payload for voice detectors: decoded mono PCM + its sample rate.
 * This is what a `DetectorInput.payload` carries for `kind: "voice_deepfake"`.
 */
export interface VoicePayload {
  samples: Float32Array;
  sampleRate: number;
}

export type ConfidenceBandId = "likely-authentic" | "uncertain" | "likely-synthetic";

/**
 * A confidence BAND — the only representation of a raw 0..1 score allowed to
 * reach a user. We never surface a bare boolean "fake/real" verdict: detection
 * is probabilistic and imperfect (see MODEL_CARD), so the product speaks in
 * bands + an explicit "signal, not a verdict" disclaimer.
 */
export interface ConfidenceBand {
  id: ConfidenceBandId;
  /** Short, honest user-facing label. */
  label: string;
  /** One-line explanation of what the band means (and does not mean). */
  description: string;
  severity: ThreatSeverity;
  /** Inclusive lower / exclusive upper bound of the 0..1 score for this band. */
  min: number;
  max: number;
}

/**
 * The public result of a Voice Truthgate analysis. Deliberately band-first; the raw
 * `confidence` is included for tooling but the UI should lead with `band`.
 */
export interface VoiceTruthgateResult {
  /** False when no detector could produce a verdict (fail-open) — treat as "unknown", never "authentic". */
  available: boolean;
  /** 0..1 "looks synthetic" score from the top detector (0 when unavailable). */
  confidence: number;
  band: ConfidenceBand;
  /** Human-readable top features / notes for the XAI panel. */
  reasons: string[];
  /** Which detector produced the top verdict (e.g. "mosadd-heuristic", "voiceguard-server"). */
  detectorId: string;
  /** Version string of the model/heuristic that produced the top verdict. */
  modelVersion: string;
  /** ALWAYS present. The product must render this next to any result. */
  disclaimer: string;
  /** Always true — a compile-time reminder that this is a signal, not a verdict. */
  isSignalNotVerdict: true;
  /** All detector verdicts that ran (heuristic triage + server confirmation, etc.). */
  verdicts: Verdict[];
}

/** Shape a server-side model returns to `createServerDetector`. */
export interface ServerVoiceVerdict {
  /** 0..1 "looks synthetic". */
  confidence: number;
  reasons?: string[];
  modelVersion?: string;
  modelHash?: string;
}

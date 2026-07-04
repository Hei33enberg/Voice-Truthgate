import { runDetectors } from "@mosadd/detection-sdk";
import type { Detector, Verdict } from "@mosadd/detection-sdk";
import { createHeuristicDetector } from "./detectors/heuristicDetector";
import { SIGNAL_NOT_VERDICT_DISCLAIMER, bandForConfidence, unavailableBand } from "./confidenceBands";
import type { VoiceTruthgateResult, VoicePayload } from "./types";

export interface AnalyzeVoiceTruthgateOptions {
  /** Detectors to run. Default: [heuristic]. Pass [heuristic, server] for hybrid. */
  detectors?: Detector[];
  /** Per-detector timeout. Default 15000ms (generous for the server model). */
  timeoutMs?: number;
  onError?: (detectorId: string, error: unknown) => void;
}

/** Reasons that mark a verdict as "no real answer" — excluded from fusion. */
const ERROR_REASONS = new Set([
  "server_unavailable",
  "invalid_payload",
  "heuristic_error",
  "noop_detector",
]);

function topByConfidence(verdicts: Verdict[]): Verdict | undefined {
  return verdicts.reduce<Verdict | undefined>(
    (best, v) => (!best || v.confidence > best.confidence ? v : best),
    undefined,
  );
}

/**
 * Run the Voice Truthgate pipeline and fuse the detector verdicts into one honest,
 * band-first result.
 *
 * Fusion (NOT naive max-confidence): the SERVER model (non-local) is
 * authoritative when it actually answered — a real anti-spoof model must be
 * able to override an on-device heuristic false-positive. Only when no server
 * answer is available do we fall back to the on-device (local) verdict. When
 * nothing usable is available we return `available:false` (band = "uncertain",
 * NEVER "likely-authentic") — the tool must fail to "unknown", not to "safe".
 */
export async function analyzeVoiceTruthgate(
  payload: VoicePayload,
  options: AnalyzeVoiceTruthgateOptions = {},
): Promise<VoiceTruthgateResult> {
  const detectors = options.detectors ?? [createHeuristicDetector()];
  const localById = new Map(detectors.map((d) => [d.meta.id, d.meta.local]));

  const { verdicts } = await runDetectors(
    detectors,
    { payload },
    { failOpen: true, timeoutMs: options.timeoutMs ?? 15000, onError: options.onError },
  );

  const usable = verdicts.filter((v) => !v.reasons.some((r) => ERROR_REASONS.has(r)));
  const serverAnswers = usable.filter((v) => localById.get(v.detectorId) === false);
  const localAnswers = usable.filter((v) => localById.get(v.detectorId) !== false);

  const authoritative = topByConfidence(serverAnswers) ?? topByConfidence(localAnswers);

  if (!authoritative) {
    return {
      available: false,
      confidence: 0,
      band: unavailableBand(),
      reasons: ["analysis_unavailable"],
      detectorId: "none",
      modelVersion: "n/a",
      disclaimer: SIGNAL_NOT_VERDICT_DISCLAIMER,
      isSignalNotVerdict: true,
      verdicts,
    };
  }

  const modelVersion = String(
    authoritative.features?.modelVersion ??
      authoritative.features?.analyzerVersion ??
      authoritative.detectorId,
  );

  return {
    available: true,
    confidence: authoritative.confidence,
    band: bandForConfidence(authoritative.confidence),
    reasons: authoritative.reasons,
    detectorId: authoritative.detectorId,
    modelVersion,
    disclaimer: SIGNAL_NOT_VERDICT_DISCLAIMER,
    isSignalNotVerdict: true,
    verdicts,
  };
}

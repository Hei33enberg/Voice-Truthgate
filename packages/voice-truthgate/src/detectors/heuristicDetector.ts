import { analyzeAudio, ANALYZER_VERSION } from "@mosadd/voice-analyzer-core";
import type { Detector, DetectorInput, Verdict } from "@mosadd/detection-sdk";
import { bandForConfidence } from "../confidenceBands";
import type { VoicePayload } from "../types";

export const HEURISTIC_DETECTOR_ID = "mosadd-heuristic";

function isVoicePayload(payload: unknown): payload is VoicePayload {
  const p = payload as VoicePayload | undefined;
  return (
    !!p &&
    p.samples instanceof Float32Array &&
    typeof p.sampleRate === "number" &&
    p.sampleRate > 0
  );
}

/**
 * On-device heuristic triage detector. Wraps @mosadd/voice-analyzer-core's
 * pure-DSP scorer behind the detection-sdk contract. Runs fully in-browser /
 * on-device (no network, no model download) — the instant, zero-cost floor.
 *
 * It is a HEURISTIC, not a trained anti-spoof model: it is deliberately the
 * cheap triage stage. The confirming verdict comes from the server detector.
 */
export function createHeuristicDetector(): Detector {
  return {
    meta: {
      id: HEURISTIC_DETECTOR_ID,
      kind: "voice_deepfake",
      version: ANALYZER_VERSION,
      supportedEnvironments: ["browser", "mobile", "edge", "server"],
      local: true,
    },
    canHandle(input: DetectorInput): boolean {
      return isVoicePayload(input.payload);
    },
    async evaluate(input: DetectorInput): Promise<Verdict> {
      const emittedAt = Date.now();
      // Contract: never throw — return a low-confidence verdict on bad input.
      if (!isVoicePayload(input.payload)) {
        return {
          detectorId: HEURISTIC_DETECTOR_ID,
          kind: "voice_deepfake",
          confidence: 0,
          severity: "low",
          reasons: ["invalid_payload"],
          emittedAt,
        };
      }
      try {
        const r = analyzeAudio(input.payload.samples, input.payload.sampleRate);
        return {
          detectorId: HEURISTIC_DETECTOR_ID,
          kind: "voice_deepfake",
          confidence: r.confidence,
          severity: bandForConfidence(r.confidence).severity,
          reasons: r.topReasons,
          features: {
            analyzerVersion: r.analyzerVersion,
            verdict: r.verdict,
            spectralTiltStdDev: r.features.spectralTiltStdDev,
            zcrJitter: r.features.zcrJitter,
            prosodyFlatness: r.features.prosodyFlatness,
            breathPauseCount: r.features.breathPauseCount,
            f0StdDev: r.features.f0StdDev,
          },
          emittedAt,
        };
      } catch {
        return {
          detectorId: HEURISTIC_DETECTOR_ID,
          kind: "voice_deepfake",
          confidence: 0,
          severity: "low",
          reasons: ["heuristic_error"],
          emittedAt,
        };
      }
    },
  };
}

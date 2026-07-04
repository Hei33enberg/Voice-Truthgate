import type { Detector, DetectorKind, Verdict } from "../types";

/**
 * Reference detector that always returns a low-confidence neutral verdict.
 * Useful for: bootstrapping a pipeline before real detectors land, smoke tests,
 * and proving fail-open semantics in CI without ML models present.
 */
export function createNoopDetector(kind: DetectorKind, id = `noop-${kind}`): Detector {
  return {
    meta: {
      id,
      kind,
      version: "0.0.0",
      supportedEnvironments: ["mobile", "edge", "server", "browser"],
      local: true,
    },
    canHandle: () => true,
    async evaluate(): Promise<Verdict> {
      return {
        detectorId: id,
        kind,
        confidence: 0,
        severity: "low",
        reasons: ["noop_detector"],
        emittedAt: Date.now(),
      };
    },
  };
}

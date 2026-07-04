import type { ThreatSeverity, ThreatSignal } from "@mosadd/threat-engine";

export type DetectorKind =
  | "voice_deepfake"
  | "phishing_text"
  | "baseband_anomaly"
  | "network_fingerprint"
  | "behavioral_anomaly"
  | "pattern_burst";

export type DetectorEnvironment = "mobile" | "edge" | "server" | "browser";

export interface DetectorMeta {
  id: string;
  kind: DetectorKind;
  version: string;
  modelHash?: string;
  supportedEnvironments: DetectorEnvironment[];
  /** Whether this detector emits its verdict locally (no network round-trip). */
  local: boolean;
}

export interface Signal extends ThreatSignal {
  detectorId: string;
  capturedAt: number;
}

export interface Verdict {
  detectorId: string;
  kind: DetectorKind;
  /** 0..1 confidence the input is malicious / synthetic / anomalous. */
  confidence: number;
  severity: ThreatSeverity;
  /** Human-readable top features that drove the verdict, for XAI overlay. */
  reasons: string[];
  /** Free-form feature vector or metadata. Never include raw PII. */
  features?: Record<string, number | string | boolean>;
  emittedAt: number;
}

export interface DetectorInput {
  /** Opaque payload — detector-specific. For voice: PCM frames. For text: utterance. */
  payload: unknown;
  /** Optional context the detector may use without taking ownership of it. */
  context?: Record<string, unknown>;
}

export interface Detector {
  meta: DetectorMeta;
  /** Cheap synchronous check whether this detector can handle the input. */
  canHandle(input: DetectorInput): boolean;
  /** Run the detector. Must never throw on bad input — return a low-confidence verdict instead. */
  evaluate(input: DetectorInput): Promise<Verdict>;
}

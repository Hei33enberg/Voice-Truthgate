// =============================================================================
// Optional telemetry contract — a privacy-preserving wire shape a client can
// use to report aggregate detector signals to a backend it operates. Purely a
// set of types + pure helpers; this package ships no transport and sends
// nothing on its own. Provided so a client and its server can type-check a
// single shared payload shape.
// =============================================================================

import type { DetectorKind } from "./types";

/**
 * Signal types that telemetry accepts. A subset of DetectorKind — only
 * those an end user might observe in the wild. If you persist these, keep
 * your storage's allowed-values check in sync with this union.
 */
export type TelemetrySignalType =
  | "voice_deepfake_observed"
  | "phishing_sms_flagged"
  | "phishing_dm_flagged"
  | "imsi_catcher_detected"
  | "baseband_anomaly"
  | "behavioral_anomaly"
  | "network_fingerprint";

export type TelemetryDeviceClass =
  | "ios_recent"
  | "ios_legacy"
  | "android_recent"
  | "android_legacy"
  | "unknown";

/** Fixed embedding length; your storage should enforce the same dimension. */
export const TELEMETRY_FEATURE_VECTOR_DIM = 512;

export interface TelemetrySubmission {
  signal_type: TelemetrySignalType;
  /** 512 finite floats; enforce this length wherever you store it. */
  feature_vector: number[];
  /** Coarse geohash (≈ tens of km), or empty string when the user opted out of geo. */
  geo_hash: string;
  device_class: TelemetryDeviceClass;
  /** Per-install random UUID generated on first launch. Never send it raw — hash it before storage. */
  installation_id: string;
  /** Hash of the consent text the user accepted. Reject stale versions. */
  consent_version: string;
  /** Identifier of the embedder that produced the vector — lets us drop rows when an embedder is deprecated. */
  model_version: string;
  /** Optional ISO timestamp; a receiver may default this to its own now(). */
  submitted_at?: string;
}

export interface TelemetryAcceptedResponse {
  accepted: true;
  id: string;
  time_bucket: string;
  note: string;
}

export interface TelemetryRejectedResponse {
  error: string;
  retry_after_ms?: number;
}

export type TelemetryResponse = TelemetryAcceptedResponse | TelemetryRejectedResponse;

/**
 * Maps the broader DetectorKind to the narrower TelemetrySignalType.
 * Returns null for detector kinds that must NEVER be sent as telemetry
 * (none today — included so the SDK can never silently drift).
 */
export function detectorKindToTelemetry(kind: DetectorKind): TelemetrySignalType | null {
  switch (kind) {
    case "voice_deepfake": return "voice_deepfake_observed";
    case "phishing_text": return "phishing_sms_flagged";
    case "baseband_anomaly": return "baseband_anomaly";
    case "network_fingerprint": return "network_fingerprint";
    case "behavioral_anomaly": return "behavioral_anomaly";
    case "pattern_burst": return null; // server-side concept, never telemetry
    default: {
      const _exhaustive: never = kind;
      void _exhaustive;
      return null;
    }
  }
}

/** Floors a Date to the start of its UTC hour. Used to compute time_bucket client-side for previews. */
export function floorToHourUtc(d: Date): Date {
  const out = new Date(d);
  out.setUTCMinutes(0, 0, 0);
  return out;
}

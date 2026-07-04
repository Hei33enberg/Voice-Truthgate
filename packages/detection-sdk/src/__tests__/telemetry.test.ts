import { describe, it, expect } from "vitest";
import {
  detectorKindToTelemetry,
  floorToHourUtc,
  TELEMETRY_FEATURE_VECTOR_DIM,
  type TelemetrySubmission,
} from "../telemetry";

describe("TELEMETRY_FEATURE_VECTOR_DIM", () => {
  it("is the fixed feature-vector dimensionality", () => {
    expect(TELEMETRY_FEATURE_VECTOR_DIM).toBe(512);
  });
});

describe("detectorKindToTelemetry", () => {
  it("maps detector kinds that ARE telemetry-eligible", () => {
    expect(detectorKindToTelemetry("voice_deepfake")).toBe("voice_deepfake_observed");
    expect(detectorKindToTelemetry("phishing_text")).toBe("phishing_sms_flagged");
    expect(detectorKindToTelemetry("baseband_anomaly")).toBe("baseband_anomaly");
    expect(detectorKindToTelemetry("network_fingerprint")).toBe("network_fingerprint");
    expect(detectorKindToTelemetry("behavioral_anomaly")).toBe("behavioral_anomaly");
  });

  it("returns null for server-side-only detector kinds", () => {
    expect(detectorKindToTelemetry("pattern_burst")).toBeNull();
  });
});

describe("floorToHourUtc", () => {
  it("floors to the start of the current UTC hour", () => {
    const d = new Date("2026-05-25T14:37:42.123Z");
    expect(floorToHourUtc(d).toISOString()).toBe("2026-05-25T14:00:00.000Z");
  });

  it("is idempotent on already-floored timestamps", () => {
    const d = new Date("2026-05-25T14:00:00.000Z");
    expect(floorToHourUtc(d).toISOString()).toBe(d.toISOString());
  });

  it("does not mutate the input", () => {
    const d = new Date("2026-05-25T14:37:42.123Z");
    const before = d.toISOString();
    floorToHourUtc(d);
    expect(d.toISOString()).toBe(before);
  });
});

describe("TelemetrySubmission (type-only — compile-time guard)", () => {
  it("accepts a well-formed payload", () => {
    const payload: TelemetrySubmission = {
      signal_type: "voice_deepfake_observed",
      feature_vector: new Array(TELEMETRY_FEATURE_VECTOR_DIM).fill(0),
      geo_hash: "841f0bffffffffff",
      device_class: "ios_recent",
      installation_id: "8e92cb1f-4d8a-4f2a-9f3a-1f3e9c2a7d0a",
      consent_version: "v1-2026-05-25",
      model_version: "detector-v1",
    };
    expect(payload.feature_vector).toHaveLength(512);
    expect(payload.geo_hash.length).toBeLessThanOrEqual(16);
  });
});

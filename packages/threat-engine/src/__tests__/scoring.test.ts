import { describe, it, expect } from "vitest";
import { computeThreatScore } from "../scoring";
import type { ThreatSignal } from "../types";

describe("computeThreatScore", () => {
  it("returns low severity and score 0 for empty signals", () => {
    const result = computeThreatScore([]);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("low");
    expect(result.reasons).toEqual([]);
  });

  it("normalizes score to 0-100 range", () => {
    const signals: ThreatSignal[] = [
      { type: "network_jitter", value: 200, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("clamps negative signal values to 0", () => {
    const signals: ThreatSignal[] = [
      { type: "network_rtt", value: -50, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.score).toBe(0);
    expect(result.severity).toBe("low");
  });

  it("returns critical severity for high combined signals", () => {
    const signals: ThreatSignal[] = [
      { type: "network_packet_loss", value: 100, weight: 2 },
      { type: "network_jitter", value: 100, weight: 2 },
      { type: "network_rtt", value: 100, weight: 2 },
    ];
    const result = computeThreatScore(signals);
    expect(result.severity).toBe("critical");
    expect(result.score).toBeGreaterThanOrEqual(85);
  });

  it("returns medium severity for moderate signals", () => {
    const signals: ThreatSignal[] = [
      { type: "network_jitter", value: 50, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.score).toBe(50);
    expect(result.severity).toBe("medium");
  });

  it("returns high severity at threshold 65", () => {
    const signals: ThreatSignal[] = [
      { type: "network_rtt", value: 65, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.score).toBe(65);
    expect(result.severity).toBe("high");
  });

  it("uses default weight of 1 when weight is omitted", () => {
    const withWeight: ThreatSignal[] = [
      { type: "network_jitter", value: 40, weight: 1 },
    ];
    const withoutWeight: ThreatSignal[] = [
      { type: "network_jitter", value: 40 },
    ];
    expect(computeThreatScore(withWeight).score).toBe(
      computeThreatScore(withoutWeight).score
    );
  });

  it("weights amplify signal contribution", () => {
    const low: ThreatSignal[] = [
      { type: "network_jitter", value: 30, weight: 1 },
    ];
    const high: ThreatSignal[] = [
      { type: "network_jitter", value: 30, weight: 3 },
    ];
    expect(computeThreatScore(high).score).toBeGreaterThan(
      computeThreatScore(low).score
    );
  });

  it("produces reason strings with severity tags", () => {
    const signals: ThreatSignal[] = [
      { type: "network_packet_loss", value: 80, weight: 1 },
      { type: "network_jitter", value: 10, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.reasons).toContain("network_packet_loss:high");
    expect(result.reasons).toContain("network_jitter:low");
  });

  it("handles mixed zero and non-zero signals", () => {
    const signals: ThreatSignal[] = [
      { type: "network_jitter", value: 0, weight: 1 },
      { type: "network_rtt", value: 80, weight: 1 },
      { type: "network_packet_loss", value: 0, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    // Average: (0 + 80 + 0) / 3 ≈ 27
    expect(result.score).toBe(27);
    expect(result.severity).toBe("low");
  });

  it("single extreme signal averages down with many zero signals", () => {
    const signals: ThreatSignal[] = [
      { type: "network_jitter", value: 100, weight: 1 },
      { type: "network_rtt", value: 0, weight: 1 },
      { type: "network_packet_loss", value: 0, weight: 1 },
      { type: "network_low_bitrate", value: 0, weight: 1 },
    ];
    const result = computeThreatScore(signals);
    expect(result.score).toBe(25);
    expect(result.severity).toBe("low");
  });
});

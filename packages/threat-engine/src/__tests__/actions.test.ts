import { describe, it, expect } from "vitest";
import { buildThreatDecision } from "../actions";
import { computeThreatScore } from "../scoring";
import type { ThreatScoreResult, ThreatSignal } from "../types";

describe("buildThreatDecision", () => {
  it("returns 'none' action for low severity", () => {
    const score: ThreatScoreResult = { score: 10, severity: "low", reasons: [] };
    const decision = buildThreatDecision(score);
    expect(decision.actions).toEqual(["none"]);
  });

  it("returns alert + increase_sampling for medium severity", () => {
    const score: ThreatScoreResult = { score: 45, severity: "medium", reasons: ["network_jitter:medium"] };
    const decision = buildThreatDecision(score);
    expect(decision.actions).toContain("alert_user");
    expect(decision.actions).toContain("increase_sampling");
    expect(decision.actions).not.toContain("start_recording");
  });

  it("returns alert + recording + increase_sampling for high severity", () => {
    const score: ThreatScoreResult = { score: 70, severity: "high", reasons: [] };
    const decision = buildThreatDecision(score);
    expect(decision.actions).toContain("alert_user");
    expect(decision.actions).toContain("start_recording");
    expect(decision.actions).toContain("increase_sampling");
    expect(decision.actions).not.toContain("disconnect_call");
  });

  it("returns full escalation for critical severity", () => {
    const score: ThreatScoreResult = { score: 95, severity: "critical", reasons: [] };
    const decision = buildThreatDecision(score);
    expect(decision.actions).toContain("alert_user");
    expect(decision.actions).toContain("start_recording");
    expect(decision.actions).toContain("disconnect_call");
    expect(decision.actions).toContain("wipe_sensitive_buffers");
  });

  it("preserves score reference in decision", () => {
    const score: ThreatScoreResult = { score: 50, severity: "medium", reasons: ["test:medium"] };
    const decision = buildThreatDecision(score);
    expect(decision.score).toBe(score);
  });

  it("end-to-end: empty signals → no action", () => {
    const score = computeThreatScore([]);
    const decision = buildThreatDecision(score);
    expect(decision.actions).toEqual(["none"]);
  });

  it("end-to-end: extreme signals → critical escalation", () => {
    const signals: ThreatSignal[] = [
      { type: "network_packet_loss", value: 100, weight: 3 },
      { type: "recording_detected", value: 100, weight: 2 },
    ];
    const score = computeThreatScore(signals);
    const decision = buildThreatDecision(score);
    expect(decision.score.severity).toBe("critical");
    expect(decision.actions).toContain("disconnect_call");
    expect(decision.actions).toContain("wipe_sensitive_buffers");
  });

  it("end-to-end: single moderate signal → medium action set", () => {
    const signals: ThreatSignal[] = [
      { type: "focus_loss", value: 50, weight: 1 },
    ];
    const score = computeThreatScore(signals);
    const decision = buildThreatDecision(score);
    expect(decision.score.severity).toBe("medium");
    expect(decision.actions).toContain("alert_user");
  });
});

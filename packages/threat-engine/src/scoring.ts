import type { ThreatScoreResult, ThreatSeverity, ThreatSignal } from "./types";

function severityFromScore(score: number): ThreatSeverity {
  if (score >= 85) return "critical";
  if (score >= 65) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function computeThreatScore(signals: ThreatSignal[]): ThreatScoreResult {
  let score = 0;
  const reasons: string[] = [];

  for (const signal of signals) {
    const weight = signal.weight ?? 1;
    const contribution = Math.max(0, Math.min(100, signal.value)) * weight;
    score += contribution;

    if (contribution >= 50) reasons.push(`${signal.type}:high`);
    else if (contribution >= 25) reasons.push(`${signal.type}:medium`);
    else if (contribution > 0) reasons.push(`${signal.type}:low`);
  }

  const normalized = Math.max(0, Math.min(100, Math.round(score / Math.max(1, signals.length))));
  return {
    score: normalized,
    severity: severityFromScore(normalized),
    reasons
  };
}

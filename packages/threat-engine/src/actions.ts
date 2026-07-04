import type { ThreatAction, ThreatDecision, ThreatScoreResult } from "./types";

function actionsForSeverity(score: ThreatScoreResult): ThreatAction[] {
  switch (score.severity) {
    case "critical":
      return ["alert_user", "start_recording", "disconnect_call", "wipe_sensitive_buffers"];
    case "high":
      return ["alert_user", "start_recording", "increase_sampling"];
    case "medium":
      return ["alert_user", "increase_sampling"];
    default:
      return ["none"];
  }
}

export function buildThreatDecision(score: ThreatScoreResult): ThreatDecision {
  return {
    score,
    actions: actionsForSeverity(score)
  };
}

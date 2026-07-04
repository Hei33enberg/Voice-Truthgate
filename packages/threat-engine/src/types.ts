export type ThreatSeverity = "low" | "medium" | "high" | "critical";

export type ThreatSignalType =
  | "network_jitter"
  | "network_rtt"
  | "network_packet_loss"
  | "network_low_bitrate"
  | "network_offline"
  | "permission_change"
  | "focus_loss"
  | "visibility_hidden"
  | "clipboard_activity"
  | "sensor_anomaly"
  | "recording_detected"
  | "webrtc_ice_failed";

export interface ThreatSignal {
  id?: string;
  source?: "REAL" | "SIMULATED";
  type: ThreatSignalType | string; // allowing string to accommodate simulation events for now
  value: number;
  weight?: number;
  metadata?: Record<string, unknown>;
}

export interface ThreatScoreResult {
  score: number;
  severity: ThreatSeverity;
  reasons: string[];
}

export type ThreatAction =
  | "none"
  | "alert_user"
  | "increase_sampling"
  | "start_recording"
  | "disconnect_call"
  | "wipe_sensitive_buffers";

export interface ThreatDecision {
  score: ThreatScoreResult;
  actions: ThreatAction[];
}

export interface BrowserThreatSnapshot {
  timestamp: string;
  visibilityState: "visible" | "hidden";
  hasFocus: boolean;
  online: boolean;
  permissions: {
    microphone: PermissionState | "unsupported";
    camera: PermissionState | "unsupported";
    geolocation: PermissionState | "unsupported";
    clipboardRead: PermissionState | "unsupported";
  };
  clipboardEvents: number;
}

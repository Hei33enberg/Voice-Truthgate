import type { BrowserThreatSnapshot, ThreatSignal } from "./types";

export function evaluateBrowserThreatSignals(snapshot: BrowserThreatSnapshot): ThreatSignal[] {
  const signals: ThreatSignal[] = [];

  if (!snapshot.online) {
    signals.push({ type: "network_offline", value: 95, weight: 2 });
  }
  if (!snapshot.hasFocus) {
    signals.push({ type: "focus_loss", value: 40, weight: 1.2 });
  }
  if (snapshot.visibilityState === "hidden") {
    signals.push({ type: "visibility_hidden", value: 45, weight: 1.2 });
  }
  if (snapshot.clipboardEvents > 0) {
    signals.push({ type: "clipboard_activity", value: Math.min(90, 20 + snapshot.clipboardEvents * 10), weight: 1.1 });
  }

  const deniedPermissions = Object.entries(snapshot.permissions).filter(([, state]) => state === "denied");
  if (deniedPermissions.length > 0) {
    signals.push({
      type: "permission_change",
      value: Math.min(95, 30 + deniedPermissions.length * 20),
      weight: 1.4,
      metadata: { deniedPermissions: deniedPermissions.map(([name]) => name) }
    });
  }

  return signals;
}

export function evaluateIceStateSignal(state: RTCIceConnectionState | "unknown"): ThreatSignal | null {
  if (state === "failed") return { type: "webrtc_ice_failed", value: 95, weight: 2 };
  if (state === "disconnected") return { type: "webrtc_ice_failed", value: 70, weight: 1.4 };
  return null;
}

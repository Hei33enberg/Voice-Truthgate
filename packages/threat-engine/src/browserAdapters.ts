import type { BrowserThreatSnapshot } from "./types";

async function readPermission(name: string): Promise<PermissionState | "unsupported"> {
  if (!("permissions" in navigator) || !navigator.permissions?.query) return "unsupported";
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state;
  } catch {
    return "unsupported";
  }
}

export async function sampleBrowserThreatSnapshot(clipboardEvents = 0): Promise<BrowserThreatSnapshot> {
  // not available in browser: recording_detected (needs native OS hooks)
  // not available in browser: sensor_anomaly (high-fidelity anti-tamper requires native sensors pipeline)
  const visibilityState = document.visibilityState === "hidden" ? "hidden" : "visible";
  const hasFocus = typeof document.hasFocus === "function" ? document.hasFocus() : true;
  const online = typeof navigator.onLine === "boolean" ? navigator.onLine : true;

  const [microphone, camera, geolocation, clipboardRead] = await Promise.all([
    readPermission("microphone"),
    readPermission("camera"),
    readPermission("geolocation"),
    readPermission("clipboard-read")
  ]);

  return {
    timestamp: new Date().toISOString(),
    visibilityState,
    hasFocus,
    online,
    permissions: {
      microphone,
      camera,
      geolocation,
      clipboardRead
    },
    clipboardEvents
  };
}

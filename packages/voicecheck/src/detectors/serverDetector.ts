import type { Detector, DetectorInput, Verdict } from "@mosadd/detection-sdk";
import { bandForConfidence } from "../confidenceBands";
import type { ServerVoiceVerdict, VoicePayload } from "../types";

export const SERVER_DETECTOR_ID = "voiceguard-server";

/**
 * Function that ships a payload to your server-side model and returns its
 * verdict. Injected so this SDK never hard-codes an endpoint, keys, or fetch:
 * the host application supplies whatever transport reaches its model (a proxy,
 * an edge function, a direct call). Kept out of the SDK so the open-source
 * package has zero infrastructure coupling.
 */
export type ServerAnalyzeFn = (payload: VoicePayload) => Promise<ServerVoiceVerdict>;

export interface ServerDetectorOptions {
  analyze: ServerAnalyzeFn;
  id?: string;
  version?: string;
  modelHash?: string;
}

function isVoicePayload(payload: unknown): payload is VoicePayload {
  const p = payload as VoicePayload | undefined;
  return !!p && p.samples instanceof Float32Array && typeof p.sampleRate === "number" && p.sampleRate > 0;
}

/**
 * Confirmation detector backed by the real server model (VoiceGuard). Non-local
 * (network round-trip). FAIL-OPEN: if the server is unreachable/errors, it
 * returns a low-confidence "server_unavailable" verdict so the pipeline keeps
 * the on-device band instead of blocking — the tool must degrade, never hang.
 */
export function createServerDetector(opts: ServerDetectorOptions): Detector {
  const id = opts.id ?? SERVER_DETECTOR_ID;
  return {
    meta: {
      id,
      kind: "voice_deepfake",
      version: opts.version ?? "voiceguard-unknown",
      modelHash: opts.modelHash,
      supportedEnvironments: ["browser", "mobile", "server"],
      local: false,
    },
    canHandle(input: DetectorInput): boolean {
      return isVoicePayload(input.payload);
    },
    async evaluate(input: DetectorInput): Promise<Verdict> {
      const emittedAt = Date.now();
      if (!isVoicePayload(input.payload)) {
        return { detectorId: id, kind: "voice_deepfake", confidence: 0, severity: "low", reasons: ["invalid_payload"], emittedAt };
      }
      try {
        const r = await opts.analyze(input.payload);
        const confidence = Number.isFinite(r.confidence) ? Math.min(1, Math.max(0, r.confidence)) : 0;
        return {
          detectorId: id,
          kind: "voice_deepfake",
          confidence,
          severity: bandForConfidence(confidence).severity,
          reasons: r.reasons && r.reasons.length ? r.reasons : [`model=${r.modelVersion ?? "server"}`],
          features: { modelVersion: r.modelVersion ?? "server", ...(r.modelHash ? { modelHash: r.modelHash } : {}) },
          emittedAt,
        };
      } catch {
        // Fail-open: server confirmation unavailable → do not block, do not claim authentic.
        return {
          detectorId: id,
          kind: "voice_deepfake",
          confidence: 0,
          severity: "low",
          reasons: ["server_unavailable"],
          emittedAt,
        };
      }
    },
  };
}

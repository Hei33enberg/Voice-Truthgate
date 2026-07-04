export * from "./types";
export * from "./score";
export * from "./extract";
export * from "./synthesize";

import { extractFeaturesFromPcm } from "./extract";
import { scoreFeatures } from "./score";
import type { VoiceAnalysisResult } from "./types";

/**
 * Convenience: PCM in, full VoiceAnalysisResult out. Runs the same
 * deterministic feature extraction + scoring in any runtime (browser,
 * React Native, edge, Node).
 */
export function analyzeAudio(samples: Float32Array, sampleRate: number): VoiceAnalysisResult {
  const features = extractFeaturesFromPcm(samples, sampleRate);
  return scoreFeatures(features);
}

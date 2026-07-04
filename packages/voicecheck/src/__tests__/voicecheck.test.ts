import { describe, it, expect } from "vitest";
import {
  synthesizeHumanPolish,
  synthesizeElevenLabsLikeSynth,
} from "@mosadd/voice-analyzer-core";
import {
  bandForConfidence,
  unavailableBand,
  CONFIDENCE_BANDS,
  SIGNAL_NOT_VERDICT_DISCLAIMER,
  createHeuristicDetector,
  createServerDetector,
  analyzeVoiceCheck,
  VOICECHECK_MODEL_CARD,
  type VoicePayload,
} from "../index";

const SR = 16000;
const humanPayload = (): VoicePayload => ({ samples: synthesizeHumanPolish("h"), sampleRate: SR });
const synthPayload = (): VoicePayload => ({ samples: synthesizeElevenLabsLikeSynth("s"), sampleRate: SR });

describe("confidenceBands", () => {
  it("maps scores to the right band", () => {
    expect(bandForConfidence(0.1).id).toBe("likely-authentic");
    expect(bandForConfidence(0.5).id).toBe("uncertain");
    expect(bandForConfidence(0.9).id).toBe("likely-synthetic");
    expect(bandForConfidence(1.0).id).toBe("likely-synthetic");
  });
  it("clamps out-of-range + non-finite input", () => {
    expect(bandForConfidence(-5).id).toBe("likely-authentic");
    expect(bandForConfidence(99).id).toBe("likely-synthetic");
    expect(bandForConfidence(NaN).id).toBe("likely-authentic");
  });
  it("unavailable maps to uncertain (never likely-authentic)", () => {
    expect(unavailableBand().id).toBe("uncertain");
  });
  it("bands are contiguous and cover 0..1", () => {
    expect(CONFIDENCE_BANDS[0]!.min).toBe(0);
    expect(CONFIDENCE_BANDS[CONFIDENCE_BANDS.length - 1]!.max).toBeGreaterThan(1);
  });
});

describe("heuristicDetector", () => {
  const det = createHeuristicDetector();
  it("handles a voice payload, rejects garbage", () => {
    expect(det.canHandle({ payload: humanPayload() })).toBe(true);
    expect(det.canHandle({ payload: { nope: 1 } })).toBe(false);
    expect(det.canHandle({ payload: null })).toBe(false);
  });
  it("never throws on bad payload", async () => {
    const v = await det.evaluate({ payload: { garbage: true } });
    expect(v.confidence).toBe(0);
    expect(v.reasons).toContain("invalid_payload");
  });
  it("scores synthetic higher than human", async () => {
    const human = await det.evaluate({ payload: humanPayload() });
    const synth = await det.evaluate({ payload: synthPayload() });
    expect(synth.confidence).toBeGreaterThan(human.confidence);
    expect(synth.kind).toBe("voice_deepfake");
  });
});

describe("analyzeVoiceCheck (heuristic-only)", () => {
  it("always returns the disclaimer + signal-not-verdict flag", async () => {
    const r = await analyzeVoiceCheck(humanPayload());
    expect(r.disclaimer).toBe(SIGNAL_NOT_VERDICT_DISCLAIMER);
    expect(r.isSignalNotVerdict).toBe(true);
    expect(r.available).toBe(true);
  });
  it("ranks synthetic above human", async () => {
    const human = await analyzeVoiceCheck(humanPayload());
    const synth = await analyzeVoiceCheck(synthPayload());
    expect(synth.confidence).toBeGreaterThan(human.confidence);
  });
});

describe("analyzeVoiceCheck (fusion: server authoritative)", () => {
  it("server verdict overrides an on-device false-positive", async () => {
    // Heuristic scores the synth sample HIGH; the (fake) real model says authentic (0.1).
    const server = createServerDetector({
      analyze: async () => ({ confidence: 0.1, modelVersion: "voiceguard-test", reasons: ["real_model=0.10"] }),
      version: "voiceguard-test",
    });
    const r = await analyzeVoiceCheck(synthPayload(), { detectors: [createHeuristicDetector(), server] });
    expect(r.detectorId).toBe("voiceguard-server");
    expect(r.confidence).toBeCloseTo(0.1, 5);
    expect(r.band.id).toBe("likely-authentic");
  });

  it("falls back to on-device when the server fails (fail-open)", async () => {
    const server = createServerDetector({
      analyze: async () => { throw new Error("server down"); },
    });
    const r = await analyzeVoiceCheck(synthPayload(), { detectors: [createHeuristicDetector(), server] });
    expect(r.available).toBe(true);
    expect(r.detectorId).toBe("mosadd-heuristic");
  });

  it("returns available:false (band uncertain) when nothing usable answers", async () => {
    const server = createServerDetector({ analyze: async () => { throw new Error("down"); } });
    const r = await analyzeVoiceCheck(synthPayload(), { detectors: [server] });
    expect(r.available).toBe(false);
    expect(r.band.id).toBe("uncertain");
    expect(r.reasons).toContain("analysis_unavailable");
  });
});

describe("model card", () => {
  it("has honest limitations + a not-for-use list + MIT", () => {
    expect(VOICECHECK_MODEL_CARD.license).toBe("MIT");
    expect(VOICECHECK_MODEL_CARD.limitations.length).toBeGreaterThanOrEqual(3);
    expect(VOICECHECK_MODEL_CARD.notForUse.length).toBeGreaterThanOrEqual(3);
    expect(VOICECHECK_MODEL_CARD.disclaimerRequired).toBe(true);
  });
});

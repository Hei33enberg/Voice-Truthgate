import { describe, it, expect } from "vitest";
import {
  analyzeAudio,
  scoreFeatures,
  extractFeaturesFromPcm,
  synthesizeHumanPolish,
  synthesizeElevenLabsLikeSynth,
  synthesizeVoiceCloneChild,
  type VoiceFeatureBundle,
} from "../index";

const SAMPLE_RATE = 16000;

describe("synthesizers", () => {
  it("produce deterministic samples for the same seed", () => {
    const a = synthesizeHumanPolish("seed-a");
    const b = synthesizeHumanPolish("seed-a");
    expect(a.length).toBe(b.length);
    for (let i = 0; i < a.length; i++) {
      expect(a[i]).toBe(b[i]);
    }
  });

  it("produce different samples for different seeds", () => {
    const a = synthesizeHumanPolish("seed-a");
    const b = synthesizeHumanPolish("seed-b");
    // Not byte-identical
    let differences = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      if (a[i] !== b[i]) differences++;
    }
    expect(differences).toBeGreaterThan(a.length / 10);
  });
});

describe("extractFeaturesFromPcm", () => {
  it("returns null-ish bundle for too-short input", () => {
    const features = extractFeaturesFromPcm(new Float32Array(100), SAMPLE_RATE);
    expect(features.spectralTiltStdDev).toBe(0);
    expect(features.breathPauseCount).toBe(0);
  });

  it("detects breath pauses in synthetic human signal", () => {
    const samples = synthesizeHumanPolish("human-pl");
    const features = extractFeaturesFromPcm(samples, SAMPLE_RATE);
    // synthesizeHumanPolish injects 2 breath gaps
    expect(features.breathPauseCount).toBeGreaterThanOrEqual(1);
  });

  it("synth signal has zero breath pauses", () => {
    const samples = synthesizeElevenLabsLikeSynth("synth");
    const features = extractFeaturesFromPcm(samples, SAMPLE_RATE);
    expect(features.breathPauseCount).toBe(0);
  });

  it("synth signal has lower zcrJitter than human signal", () => {
    const human = extractFeaturesFromPcm(synthesizeHumanPolish("h"), SAMPLE_RATE);
    const synth = extractFeaturesFromPcm(synthesizeElevenLabsLikeSynth("s"), SAMPLE_RATE);
    expect(synth.zcrJitter).toBeLessThanOrEqual(human.zcrJitter);
  });

  it("synth signal has higher prosodyFlatness than human signal", () => {
    const human = extractFeaturesFromPcm(synthesizeHumanPolish("h"), SAMPLE_RATE);
    const synth = extractFeaturesFromPcm(synthesizeElevenLabsLikeSynth("s"), SAMPLE_RATE);
    expect(synth.prosodyFlatness).toBeGreaterThan(human.prosodyFlatness);
  });
});

describe("scoreFeatures", () => {
  it("classifies a clearly-synth feature bundle as VOICE_DEEPFAKE_HIGH_CONFIDENCE", () => {
    const synthBundle: VoiceFeatureBundle = {
      spectralTiltMean: 0.2,
      spectralTiltStdDev: 0.05,    // very stable
      zcrMean: 0.12,
      zcrJitter: 0.002,            // very smooth
      prosodyFlatness: 0.95,       // very flat
      breathPauseCount: 0,
      estimatedF0Hz: 200,
      f0StdDev: 3,                 // very monotone
    };
    const result = scoreFeatures(synthBundle);
    expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    expect(result.verdict).toBe("VOICE_DEEPFAKE_HIGH_CONFIDENCE");
  });

  it("classifies a clearly-human feature bundle as NOMINAL", () => {
    const humanBundle: VoiceFeatureBundle = {
      spectralTiltMean: 0.3,
      spectralTiltStdDev: 0.6,
      zcrMean: 0.10,
      zcrJitter: 0.04,
      prosodyFlatness: 0.15,
      breathPauseCount: 3,
      estimatedF0Hz: 220,
      f0StdDev: 45,
    };
    const result = scoreFeatures(humanBundle);
    expect(result.confidence).toBeLessThan(0.40);
    expect(result.verdict).toBe("VOICE_ANALYSIS_NOMINAL");
  });

  it("topReasons contains the analyzer version stamp", () => {
    const human: VoiceFeatureBundle = {
      spectralTiltMean: 0.3, spectralTiltStdDev: 0.6, zcrMean: 0.1, zcrJitter: 0.04,
      prosodyFlatness: 0.15, breathPauseCount: 3, estimatedF0Hz: 220, f0StdDev: 45,
    };
    const r = scoreFeatures(human);
    expect(r.topReasons[0]).toMatch(/^heuristic_score=\d\.\d{2}$/);
    expect(r.analyzerVersion).toBe("heuristic-1.0");
  });

  it("score is deterministic across runs", () => {
    const bundle: VoiceFeatureBundle = {
      spectralTiltMean: 0.2, spectralTiltStdDev: 0.05, zcrMean: 0.12, zcrJitter: 0.002,
      prosodyFlatness: 0.95, breathPauseCount: 0, estimatedF0Hz: 200, f0StdDev: 3,
    };
    const a = scoreFeatures(bundle).confidence;
    const b = scoreFeatures(bundle).confidence;
    expect(a).toBe(b);
  });
});

describe("analyzeAudio (end-to-end)", () => {
  it("human polish synthetic sample → NOMINAL or low OBSERVED", () => {
    const samples = synthesizeHumanPolish("h-e2e");
    const result = analyzeAudio(samples, SAMPLE_RATE);
    expect(result.confidence).toBeLessThan(0.55);
    expect(result.verdict).toBe("VOICE_ANALYSIS_NOMINAL");
  });

  it("ElevenLabs-like synth sample → HIGH_CONFIDENCE or OBSERVED", () => {
    const samples = synthesizeElevenLabsLikeSynth("s-e2e");
    const result = analyzeAudio(samples, SAMPLE_RATE);
    expect(result.confidence).toBeGreaterThanOrEqual(0.55);
    expect(["VOICE_DEEPFAKE_OBSERVED", "VOICE_DEEPFAKE_HIGH_CONFIDENCE"]).toContain(result.verdict);
  });

  it("voice clone child sample → at least OBSERVED", () => {
    const samples = synthesizeVoiceCloneChild("c-e2e");
    const result = analyzeAudio(samples, SAMPLE_RATE);
    expect(result.verdict).not.toBe("VOICE_ANALYSIS_NOMINAL");
  });

  it("human > synth ranking is stable across seeds", () => {
    const seeds = ["a", "b", "c", "d"];
    const humanConfidences = seeds.map((s) => analyzeAudio(synthesizeHumanPolish(`h-${s}`), SAMPLE_RATE).confidence);
    const synthConfidences = seeds.map((s) => analyzeAudio(synthesizeElevenLabsLikeSynth(`s-${s}`), SAMPLE_RATE).confidence);
    const maxHuman = Math.max(...humanConfidences);
    const minSynth = Math.min(...synthConfidences);
    expect(minSynth).toBeGreaterThan(maxHuman);
  });
});

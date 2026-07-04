import { describe, it, expect } from "vitest";
import { runDetectors } from "../pipeline";
import { createNoopDetector } from "../detectors/noop";
import type { Detector } from "../types";

describe("runDetectors", () => {
  it("returns verdicts from every applicable detector", async () => {
    const detectors = [
      createNoopDetector("voice_deepfake"),
      createNoopDetector("phishing_text"),
    ];
    const result = await runDetectors(detectors, { payload: null });
    expect(result.verdicts).toHaveLength(2);
    expect(result.top?.confidence).toBe(0);
  });

  it("fail-open: a throwing detector does not break the pipeline", async () => {
    const broken: Detector = {
      meta: {
        id: "broken",
        kind: "voice_deepfake",
        version: "0.0.0",
        supportedEnvironments: ["server"],
        local: true,
      },
      canHandle: () => true,
      evaluate: () => {
        throw new Error("boom");
      },
    };
    const detectors = [broken, createNoopDetector("phishing_text")];
    const errors: string[] = [];
    const result = await runDetectors(detectors, { payload: null }, {
      onError: (id) => errors.push(id),
    });
    expect(errors).toEqual(["broken"]);
    expect(result.verdicts).toHaveLength(1);
    expect(result.verdicts[0]!.kind).toBe("phishing_text");
  });

  it("skips detectors whose canHandle returns false", async () => {
    const picky: Detector = {
      meta: {
        id: "picky",
        kind: "voice_deepfake",
        version: "0.0.0",
        supportedEnvironments: ["mobile"],
        local: true,
      },
      canHandle: () => false,
      evaluate: async () => ({
        detectorId: "picky",
        kind: "voice_deepfake",
        confidence: 1,
        severity: "critical",
        reasons: [],
        emittedAt: Date.now(),
      }),
    };
    const result = await runDetectors([picky], { payload: null });
    expect(result.verdicts).toHaveLength(0);
    expect(result.top).toBeUndefined();
  });

  it("picks the highest confidence verdict as top", async () => {
    const high: Detector = {
      meta: {
        id: "high",
        kind: "voice_deepfake",
        version: "0.0.0",
        supportedEnvironments: ["server"],
        local: true,
      },
      canHandle: () => true,
      evaluate: async () => ({
        detectorId: "high",
        kind: "voice_deepfake",
        confidence: 0.91,
        severity: "high",
        reasons: ["synth_voice"],
        emittedAt: Date.now(),
      }),
    };
    const result = await runDetectors([high, createNoopDetector("phishing_text")], {
      payload: null,
    });
    expect(result.top?.detectorId).toBe("high");
    expect(result.top?.confidence).toBeCloseTo(0.91);
  });
});

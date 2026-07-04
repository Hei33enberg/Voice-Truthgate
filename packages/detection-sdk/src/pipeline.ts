import type { Detector, DetectorInput, Verdict } from "./types";

export interface PipelineResult {
  verdicts: Verdict[];
  /** Highest-confidence verdict, useful for binary gating. */
  top?: Verdict;
}

export interface PipelineOptions {
  /** Fail-open: if a detector throws, log and continue with the rest. Default true. */
  failOpen?: boolean;
  /** Per-detector timeout in milliseconds. Default 1000. */
  timeoutMs?: number;
  onError?: (detectorId: string, error: unknown) => void;
}

const DEFAULT_TIMEOUT_MS = 1000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`detector_timeout_${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(id);
        resolve(value);
      },
      (err) => {
        clearTimeout(id);
        reject(err);
      },
    );
  });
}

/**
 * Run every applicable detector in parallel. Always returns a result —
 * fail-open is the default so a single detector bug (throw, timeout, garbage)
 * can never block the host application.
 */
export async function runDetectors(
  detectors: Detector[],
  input: DetectorInput,
  options: PipelineOptions = {},
): Promise<PipelineResult> {
  const failOpen = options.failOpen ?? true;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const applicable = detectors.filter((d) => {
    try {
      return d.canHandle(input);
    } catch {
      return false;
    }
  });

  const settled = await Promise.allSettled(
    applicable.map((d) =>
      withTimeout(
        Promise.resolve().then(() => d.evaluate(input)),
        timeoutMs,
      ),
    ),
  );

  const verdicts: Verdict[] = [];
  settled.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      verdicts.push(result.value);
      return;
    }
    options.onError?.(applicable[idx]!.meta.id, result.reason);
    if (!failOpen) {
      throw result.reason;
    }
  });

  const top = verdicts.reduce<Verdict | undefined>((best, v) => {
    if (!best || v.confidence > best.confidence) return v;
    return best;
  }, undefined);

  return { verdicts, top };
}

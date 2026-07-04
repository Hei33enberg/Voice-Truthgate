// =============================================================================
// extractFeaturesFromPcm — pure-TS feature extraction from 16-bit PCM audio
// represented as Float32Array in -1..1 range. No DOM, no Web Audio, no FFT
// library. We compute time-domain statistics + a coarse spectral tilt
// approximation via Goertzel filters at two bands.
//
// This is intentionally simple — for full FFT spectrogram analysis we'd
// pull a dependency or move to onnxruntime. The MVP demo gets enough
// signal from time-domain + 2-band energy ratio to distinguish ElevenLabs
// PL from human speech.
// =============================================================================

import type { VoiceFeatureBundle } from "./types";

/** Goertzel filter — narrow-band energy at target frequency. O(n) per band. */
function goertzelEnergy(samples: Float32Array, sampleRate: number, targetHz: number): number {
  const k = (targetHz / sampleRate) * samples.length;
  const w = (2 * Math.PI / samples.length) * k;
  const cosW = Math.cos(w);
  const coeff = 2 * cosW;
  let s0 = 0, s1 = 0, s2 = 0;
  for (let i = 0; i < samples.length; i++) {
    s0 = samples[i]! + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  const real = s1 - s2 * cosW;
  const imag = s2 * Math.sin(w);
  return real * real + imag * imag;
}

function zeroCrossingRate(samples: Float32Array): number {
  if (samples.length < 2) return 0;
  let crossings = 0;
  for (let i = 1; i < samples.length; i++) {
    if ((samples[i - 1]! >= 0) !== (samples[i]! >= 0)) crossings++;
  }
  return crossings / samples.length;
}

function rms(samples: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return Math.sqrt(sum / Math.max(1, samples.length));
}

function variance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const v = values.reduce((s, x) => s + (x - mean) * (x - mean), 0) / values.length;
  return v;
}

/**
 * Estimate fundamental frequency via autocorrelation. Returns 0 if no
 * confident pitch detected. Good enough for jitter analysis on speech.
 */
function estimateF0(samples: Float32Array, sampleRate: number): number {
  const minLag = Math.floor(sampleRate / 400); // 400 Hz upper
  const maxLag = Math.floor(sampleRate / 70);  // 70 Hz lower
  if (samples.length <= maxLag) return 0;

  let bestLag = -1;
  let bestCorr = -Infinity;
  // Coarse search every 2 samples to keep this cheap.
  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let corr = 0;
    for (let i = 0; i + lag < samples.length; i++) {
      corr += samples[i]! * samples[i + lag]!;
    }
    if (corr > bestCorr) {
      bestCorr = corr;
      bestLag = lag;
    }
  }
  if (bestLag <= 0) return 0;
  return sampleRate / bestLag;
}

export interface ExtractOptions {
  windowSize?: number;    // default 1024 ≈ 64ms at 16kHz
  hopSize?: number;       // default 512 ≈ 32ms
  silenceRmsThreshold?: number; // below this = silence/breath candidate
}

/**
 * Slide a window through samples, compute per-frame features, aggregate.
 * Returns a VoiceFeatureBundle ready for scoreFeatures().
 *
 * Deterministic: same input → identical output bytes.
 */
export function extractFeaturesFromPcm(
  samples: Float32Array,
  sampleRate: number,
  opts: ExtractOptions = {},
): VoiceFeatureBundle {
  const windowSize = opts.windowSize ?? 1024;
  const hopSize = opts.hopSize ?? 512;
  const silenceThreshold = opts.silenceRmsThreshold ?? 0.01;

  if (samples.length < windowSize) {
    // Too short to analyse. Return null-ish bundle that scoreFeatures()
    // will classify as low-confidence-not-synthetic.
    return {
      spectralTiltMean: 0,
      spectralTiltStdDev: 0,
      zcrMean: 0,
      zcrJitter: 0,
      prosodyFlatness: 0,
      breathPauseCount: 0,
      estimatedF0Hz: 0,
      f0StdDev: 0,
    };
  }

  const zcrFrames: number[] = [];
  const tiltFrames: number[] = [];
  const energyFrames: number[] = [];
  const f0Frames: number[] = [];

  for (let start = 0; start + windowSize <= samples.length; start += hopSize) {
    const frame = samples.subarray(start, start + windowSize);
    zcrFrames.push(zeroCrossingRate(frame));
    const lowEnergy = goertzelEnergy(frame, sampleRate, 300);
    const highEnergy = goertzelEnergy(frame, sampleRate, 3000);
    const eps = 1e-9;
    tiltFrames.push(Math.log((highEnergy + eps) / (lowEnergy + eps)));
    energyFrames.push(rms(frame));
    const f0 = estimateF0(frame, sampleRate);
    if (f0 > 0) f0Frames.push(f0);
  }

  // Breath pauses: detect each contiguous "silent run" flanked on both
  // sides by a loud frame. A run is silent if every frame in it is below
  // silenceThreshold; flanks are "loud" if above silenceThreshold * 4.
  // Runs longer than ~1.5 s are treated as ambient silence, not breaths.
  const loudThreshold = silenceThreshold * 4;
  const maxBreathRunFrames = 50; // ~1.5s at hop=512/sr=16k
  let breathPauseCount = 0;
  let inRun = false;
  let runStart = -1;
  let hadLoudBefore = false;
  for (let i = 0; i < energyFrames.length; i++) {
    const v = energyFrames[i]!;
    if (v >= loudThreshold) {
      if (inRun && hadLoudBefore) {
        const runLen = i - runStart;
        if (runLen <= maxBreathRunFrames) breathPauseCount++;
      }
      inRun = false;
      hadLoudBefore = true;
    } else if (v < silenceThreshold) {
      if (!inRun) {
        inRun = true;
        runStart = i;
      }
    }
    // Values between silenceThreshold and loudThreshold are "voiced quiet"
    // — they neither close a run nor open one. Keeps the loop simple.
  }

  // Prosody flatness: 1 - normalised stddev of energy envelope.
  const energyMean = energyFrames.reduce((s, v) => s + v, 0) / Math.max(1, energyFrames.length);
  const energyVar = variance(energyFrames);
  const energyStd = Math.sqrt(energyVar);
  const normStd = energyMean > 0 ? energyStd / energyMean : 0;
  // normStd ≈ 0.6+ for real speech, ≈ 0.1 for synth. Map to 0..1 flat.
  const prosodyFlatness = Math.max(0, 1 - normStd / 0.6);

  const tiltMean = tiltFrames.reduce((s, v) => s + v, 0) / Math.max(1, tiltFrames.length);
  const tiltStd = Math.sqrt(variance(tiltFrames));
  const zcrMean = zcrFrames.reduce((s, v) => s + v, 0) / Math.max(1, zcrFrames.length);
  const zcrJit = Math.sqrt(variance(zcrFrames));
  const f0Mean = f0Frames.length > 0 ? f0Frames.reduce((s, v) => s + v, 0) / f0Frames.length : 0;
  const f0Std = f0Frames.length > 0 ? Math.sqrt(variance(f0Frames)) : 0;

  return {
    spectralTiltMean: tiltMean,
    spectralTiltStdDev: tiltStd,
    zcrMean,
    zcrJitter: zcrJit,
    prosodyFlatness,
    breathPauseCount,
    estimatedF0Hz: f0Mean,
    f0StdDev: f0Std,
  };
}

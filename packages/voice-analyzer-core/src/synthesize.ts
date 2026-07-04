// =============================================================================
// Sample synthesizers — generate deterministic PCM buffers that mimic the
// statistical fingerprint of "real speech" vs "TTS synth" vs "voice clone".
// Used for offline, reproducible demos and tests.
//
// These are NOT real recordings — they are synthetic audio with known
// feature distributions.
// =============================================================================

/** Mulberry32 — deterministic PRNG seeded by a string. */
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashStringToSeed(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface SynthOptions {
  durationSec?: number;
  sampleRate?: number;
}

/**
 * "Real polish woman, Warsaw" — rich F0 variance, natural ZCR jitter,
 * occasional breath pauses, varied energy envelope.
 */
export function synthesizeHumanPolish(seed = "human-pl", opts: SynthOptions = {}): Float32Array {
  const sampleRate = opts.sampleRate ?? 16000;
  const duration = opts.durationSec ?? 3;
  const N = sampleRate * duration;
  const out = new Float32Array(N);
  const rand = mulberry32(hashStringToSeed(seed));

  // F0 wanders between 170 and 250 Hz over time (varied prosody).
  // Envelope is non-uniform with 2 low-energy gaps (breaths). Gap length
  // must comfortably exceed the analyzer window (1024 samples = 64ms) so
  // at least one frame falls fully inside the gap with flanking frames
  // fully outside it. 200ms gives us margin even with 50% hop overlap.
  const breathStart1 = Math.floor(N * 0.30);
  const breathStart2 = Math.floor(N * 0.70);
  const breathLen = Math.floor(sampleRate * 0.20);

  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    // F0 with slow drift + micro-jitter
    const f0 = 210 + 35 * Math.sin(2 * Math.PI * 0.8 * t) + (rand() - 0.5) * 8;
    // Add a few harmonics with natural decay
    let s = Math.sin(2 * Math.PI * f0 * t) * 0.55;
    s += Math.sin(2 * Math.PI * f0 * 2 * t) * 0.22;
    s += Math.sin(2 * Math.PI * f0 * 3 * t) * 0.12;
    // Noise component (breath, fricatives)
    s += (rand() - 0.5) * 0.18;
    // Envelope: slow varying + short breath dips
    let env = 0.6 + 0.35 * Math.sin(2 * Math.PI * 0.55 * t + 1.0);
    // Deep breath gaps — energy must drop well below the 0.01 silence
    // threshold while flanking frames stay above 0.04. Multiplier 0.01
    // gives ~0.005 RMS during the gap.
    if (i >= breathStart1 && i < breathStart1 + breathLen) env *= 0.01;
    if (i >= breathStart2 && i < breathStart2 + breathLen) env *= 0.01;
    out[i] = Math.max(-1, Math.min(1, s * env));
  }
  return out;
}

/**
 * "ElevenLabs PL synth" — uniform F0, very low ZCR jitter, zero breaths,
 * flat energy envelope.
 */
export function synthesizeElevenLabsLikeSynth(seed = "elevenlabs-pl", opts: SynthOptions = {}): Float32Array {
  const sampleRate = opts.sampleRate ?? 16000;
  const duration = opts.durationSec ?? 3;
  const N = sampleRate * duration;
  const out = new Float32Array(N);
  const rand = mulberry32(hashStringToSeed(seed));

  // F0 nearly constant — tiny smooth wobble, no real jitter.
  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    const f0 = 195 + 3 * Math.sin(2 * Math.PI * 0.3 * t); // ±3 Hz drift, no jitter
    let s = Math.sin(2 * Math.PI * f0 * t) * 0.6;
    s += Math.sin(2 * Math.PI * f0 * 2 * t) * 0.25;
    s += Math.sin(2 * Math.PI * f0 * 3 * t) * 0.10;
    // Almost no noise — clean synth fingerprint
    s += (rand() - 0.5) * 0.03;
    // Flat envelope, no breaths
    const env = 0.7 + 0.04 * Math.sin(2 * Math.PI * 1.2 * t);
    out[i] = Math.max(-1, Math.min(1, s * env));
  }
  return out;
}

/**
 * "AI clone of child / victim" — narrow F0 range like a real child but
 * unnaturally flat micro-variation and no breaths. Hardest case.
 */
export function synthesizeVoiceCloneChild(seed = "clone-child", opts: SynthOptions = {}): Float32Array {
  const sampleRate = opts.sampleRate ?? 16000;
  const duration = opts.durationSec ?? 3;
  const N = sampleRate * duration;
  const out = new Float32Array(N);
  const rand = mulberry32(hashStringToSeed(seed));

  for (let i = 0; i < N; i++) {
    const t = i / sampleRate;
    // Child-like higher F0, but suspiciously smooth (very narrow wobble)
    const f0 = 285 + 3 * Math.sin(2 * Math.PI * 0.4 * t);
    let s = Math.sin(2 * Math.PI * f0 * t) * 0.5;
    s += Math.sin(2 * Math.PI * f0 * 2 * t) * 0.30;
    s += Math.sin(2 * Math.PI * f0 * 3 * t) * 0.15;
    // Very low noise — synthesizer fingerprint
    s += (rand() - 0.5) * 0.02;
    // Tightly bounded envelope, no real breaths
    const env = 0.70 + 0.05 * Math.sin(2 * Math.PI * 0.6 * t + 0.3);
    out[i] = Math.max(-1, Math.min(1, s * env));
  }
  return out;
}

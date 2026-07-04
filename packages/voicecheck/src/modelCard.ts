/**
 * Machine-readable model card, consumed by the SDK, the hosted checker UI, and
 * the public /model-card page. Keep in sync with MODEL_CARD.md. Honesty about
 * limitations is a product requirement, not a footnote (see the VoiceCheck plan).
 */
export interface ModelCard {
  name: string;
  version: string;
  summary: string;
  /** The two-stage design. */
  stages: { id: string; role: string; local: boolean; note: string }[];
  intendedUse: string[];
  /** Hard "do NOT" list — legal + ethical guardrails. */
  notForUse: string[];
  /** Known failure modes, stated plainly. */
  limitations: string[];
  disclaimerRequired: true;
  license: "MIT";
}

export const VOICECHECK_MODEL_CARD: ModelCard = {
  name: "VoiceCheck by mosADD",
  version: "0.1.0-alpha",
  summary:
    "A two-stage voice-authenticity signal: an instant on-device heuristic triage " +
    "plus an opt-in stronger on-device model (a real trained deepfake classifier run " +
    "in the browser). Both run on-device — audio never leaves your browser. Outputs a " +
    "confidence BAND, never a definitive real/fake verdict.",
  stages: [
    {
      id: "mosadd-heuristic",
      role: "on-device triage",
      local: true,
      note: "Hand-tuned DSP heuristic (spectral tilt, ZCR jitter, prosody flatness, breath pauses, F0 variance). Instant, private, weak on modern TTS — a triage floor, not the verdict.",
    },
    {
      id: "wav2vec2-edge",
      role: "stronger on-device model (opt-in)",
      local: true,
      note: "A real trained wav2vec2 deepfake classifier run IN-BROWSER via transformers.js (one-time ~379 MB download, cached). Authoritative over the heuristic; still fully on-device — audio never leaves the browser. A managed server model can be added later for heavier accuracy.",
    },
  ],
  intendedUse: [
    "Screening / triage before human review",
    "Awareness and education about voice deepfakes",
    "A pre-check inside security / fact-check / newsroom workflows",
  ],
  notForUse: [
    "Sole evidence to accuse, identify, or defame a person",
    "Legal, forensic, custody, or law-enforcement conclusions without a certified expert",
    "Any high-stakes decision based on the score alone",
  ],
  limitations: [
    "No detector reliably exceeds ~85% on unseen, modern premium TTS (e.g. latest ElevenLabs) — false negatives happen.",
    "Codec compression (Opus / MP3 / telephony) is the #1 accuracy killer (−10–40%); real phone/VPN/Zoom audio is compressed. Prefer uploaded, less-compressed clips.",
    "Short clips (< ~3s), heavy background noise, and distressed/atypical real speech raise the false-positive rate.",
    "Accuracy varies by language and accent; coverage outside English/Polish is weaker.",
    "Adversarially crafted audio can evade detection.",
  ],
  disclaimerRequired: true,
  license: "MIT",
};

# Model Card — Voice Truthgate by mosADD

**Version:** 0.1.0-alpha · **License:** MIT (this SDK) · server model VoiceGuard is Apache-2.0

A two-stage voice-authenticity **signal**: an instant on-device heuristic triage plus an optional server confirmation by a trained anti-spoof model. Outputs a **confidence band**, never a definitive real/fake verdict.

## Stages
| Stage | Role | Runs | Note |
|---|---|---|---|
| `mosadd-heuristic` | on-device triage | in the browser / on device | Hand-tuned DSP heuristic. Fast, private, weak on modern TTS — a triage floor, not the verdict. |
| `voiceguard-server` | server confirmation | server-side | Trained anti-spoof model (VoiceGuard, XLS-R+AASIST). Authoritative when reachable; fail-open if not. |

## Intended use
- Screening / triage before human review.
- Awareness and education about voice deepfakes.
- A pre-check inside security / fact-check / newsroom workflows.

## NOT for use
- **Not** sole evidence to accuse, identify, or defame a person.
- **Not** for legal, forensic, custody, or law-enforcement conclusions without a certified expert.
- **Not** for any high-stakes decision based on the score alone.

## Limitations (stated plainly)
- No detector reliably exceeds ~85% on unseen, modern premium TTS (e.g. latest ElevenLabs) — **false negatives happen**.
- **Codec compression (Opus / MP3 / telephony) is the #1 accuracy killer (−10–40%)**; real phone / VPN / Zoom audio is compressed. Prefer uploaded, less-compressed clips.
- Short clips (< ~3 s), heavy background noise, and distressed / atypical real speech raise the **false-positive** rate.
- Accuracy varies by language and accent; coverage outside English / Polish is weaker.
- Adversarially crafted audio can evade detection.

## Interpretation
Results are one of three bands — `likely-authentic`, `uncertain`, `likely-synthetic` — each shipped with: *"This is a signal, not a verdict. Automated voice-authenticity detection is probabilistic and can be wrong in both directions. Do not use this result alone to accuse, identify, or make legal/forensic decisions about a person."*

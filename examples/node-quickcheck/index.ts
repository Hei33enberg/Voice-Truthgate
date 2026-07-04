/**
 * Voice Truthgate — Node quick-check demo (and CI smoke test).
 *
 * No audio files needed: we deterministically synthesize a "human-like" and a
 * "synthetic-like" signal, run them through the on-device heuristic, and print
 * the honest confidence BAND for each.
 *
 * IMPORTANT: these are synthesized signals with known feature distributions,
 * NOT real recordings, and Stage 1 is a heuristic triage floor — not a verdict.
 * It exists to demonstrate the API and the band-first, "signal not verdict"
 * output shape. Real accuracy comes from pairing in a trained model (see the
 * browser example and the model card).
 */
import { analyzeVoiceTruthgate } from "@mosadd/voice-truthgate";
import {
  synthesizeHumanPolish,
  synthesizeElevenLabsLikeSynth,
  synthesizeVoiceCloneChild,
} from "@mosadd/voice-analyzer-core";

const SAMPLE_RATE = 16000;

const EMOJI: Record<string, string> = {
  "likely-authentic": "🟢",
  uncertain: "🟡",
  "likely-synthetic": "🔴",
};

async function check(name: string, samples: Float32Array) {
  const r = await analyzeVoiceTruthgate({ samples, sampleRate: SAMPLE_RATE });
  const dot = EMOJI[r.band.id] ?? "•";
  console.log(
    `${dot}  ${name.padEnd(22)}  ${r.band.label.padEnd(18)}  score=${r.confidence.toFixed(2)}  (${r.detectorId})`,
  );
  return r;
}

async function main() {
  console.log("Voice Truthgate — on-device heuristic quick-check\n");
  console.log("  (synthesized signals, not real audio — Stage 1 heuristic triage only)\n");

  const human = await check("human-like clip", synthesizeHumanPolish("demo-human"));
  const synth = await check("synthetic-like clip", synthesizeElevenLabsLikeSynth("demo-synth"));
  const clone = await check("voice-clone-like clip", synthesizeVoiceCloneChild("demo-clone"));

  console.log(`\n  disclaimer: ${human.disclaimer}\n`);

  // ---- Smoke assertions (make CI fail on regression) ----
  const failures: string[] = [];
  if (!(synth.confidence > human.confidence)) {
    failures.push(
      `expected synthetic-like (${synth.confidence.toFixed(2)}) to score higher than human-like (${human.confidence.toFixed(2)})`,
    );
  }
  if (!human.disclaimer || !human.isSignalNotVerdict) {
    failures.push("every result must carry the 'signal, not a verdict' disclaimer");
  }
  for (const r of [human, synth, clone]) {
    if (!["likely-authentic", "uncertain", "likely-synthetic"].includes(r.band.id)) {
      failures.push(`unexpected band id: ${r.band.id}`);
    }
  }

  if (failures.length) {
    console.error("SMOKE TEST FAILED:");
    for (const f of failures) console.error("  - " + f);
    process.exit(1);
  }
  console.log("smoke test OK ✓");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

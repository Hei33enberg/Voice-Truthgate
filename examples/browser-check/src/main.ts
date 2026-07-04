/**
 * VoiceCheck — browser demo.
 *
 * Record or upload a clip → decode to 16 kHz mono → show the instant heuristic
 * BAND → optionally download & run a real model IN THE BROWSER for a stronger,
 * authoritative band. Nothing is uploaded; everything runs on-device.
 *
 * This mirrors the production pattern with fresh MIT code. The instant band
 * uses `voicecheck-lite` (a teaching stand-in); a real app would use
 * @mosadd/voicecheck + @mosadd/voice-analyzer-core.
 */
import {
  SIGNAL_NOT_VERDICT_DISCLAIMER,
  bandForConfidence,
  heuristicScore,
  type Band,
} from "./voicecheck-lite";

const TARGET_SR = 16000;
const MODEL_ID = "as1605/Deepfake-audio-detection-V2";
// Pin a specific model revision so a future re-label/update can't silently change
// behaviour (supply-chain hygiene — as1605 is itself a fork of MelodyMachine/…).
const MODEL_REVISION = "3aeb18add053e945dc69025147afab0d70fa0188";

const els = {
  file: document.getElementById("file") as HTMLInputElement,
  record: document.getElementById("record") as HTMLButtonElement,
  strong: document.getElementById("strong") as HTMLButtonElement,
  result: document.getElementById("result") as HTMLDivElement,
  disclaimer: document.getElementById("disclaimer") as HTMLDivElement,
  status: document.getElementById("status") as HTMLDivElement,
};

els.disclaimer.textContent = SIGNAL_NOT_VERDICT_DISCLAIMER;

let currentPcm: Float32Array | null = null;

/** Decode an ArrayBuffer of audio → 16 kHz mono Float32 PCM. */
async function decodeTo16kMono(data: ArrayBuffer): Promise<Float32Array> {
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(data);
  await ctx.close();

  // Downmix to mono
  const mono = new Float32Array(decoded.length);
  for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
    const chData = decoded.getChannelData(ch);
    for (let i = 0; i < chData.length; i++) mono[i] += chData[i] / decoded.numberOfChannels;
  }

  if (decoded.sampleRate === TARGET_SR) return mono;

  // Resample to 16 kHz via an OfflineAudioContext
  const offline = new OfflineAudioContext(1, Math.ceil((mono.length * TARGET_SR) / decoded.sampleRate), TARGET_SR);
  const buf = offline.createBuffer(1, mono.length, decoded.sampleRate);
  buf.copyToChannel(mono, 0);
  const src = offline.createBufferSource();
  src.buffer = buf;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0).slice();
}

function renderBand(band: Band, confidence: number, source: string) {
  els.result.innerHTML = `
    <div class="band band-${band.id}">
      <div class="band-head">${band.emoji} ${band.label}</div>
      <div class="band-desc">${band.description}</div>
      <div class="band-meta">score ${confidence.toFixed(2)} · ${source}</div>
    </div>`;
  els.strong.disabled = false;
}

function setStatus(msg: string) {
  els.status.textContent = msg;
}

async function onAudio(data: ArrayBuffer) {
  setStatus("Decoding…");
  try {
    currentPcm = await decodeTo16kMono(data);
  } catch (err) {
    setStatus("Could not decode that file. Try a WAV/MP3/OGG clip.");
    return;
  }
  const score = heuristicScore(currentPcm, TARGET_SR);
  renderBand(bandForConfidence(score), score, "instant on-device check");
  setStatus(`Ready. ${(currentPcm.length / TARGET_SR).toFixed(1)}s of audio. You can run the stronger AI check.`);
}

// ---- File upload ----
els.file.addEventListener("change", async () => {
  const f = els.file.files?.[0];
  if (!f) return;
  await onAudio(await f.arrayBuffer());
});

// ---- Record from mic ----
let mediaRecorder: MediaRecorder | null = null;
let chunks: BlobPart[] = [];
els.record.addEventListener("click", async () => {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      els.record.textContent = "● Record";
      await onAudio(await new Blob(chunks).arrayBuffer());
    };
    mediaRecorder.start();
    els.record.textContent = "■ Stop";
    setStatus("Recording… click Stop when done.");
  } catch {
    setStatus("Microphone permission denied.");
  }
});

// ---- Stronger on-device model (opt-in, ~379 MB download once) ----
let classifier: ((input: Float32Array) => Promise<Array<{ label: string; score: number }>>) | null = null;

els.strong.addEventListener("click", async () => {
  if (!currentPcm) return;
  els.strong.disabled = true;
  try {
    if (!classifier) {
      setStatus("Downloading the model once (~379 MB) — this runs entirely in your browser…");
      const { pipeline } = await import("@huggingface/transformers");
      classifier = (await pipeline("audio-classification", MODEL_ID, { revision: MODEL_REVISION })) as unknown as typeof classifier;
    }
    setStatus("Running the stronger AI check on-device…");
    const out = await classifier!(currentPcm);
    const confidence = syntheticProbability(out);
    renderBand(bandForConfidence(confidence), confidence, "stronger on-device model");
    setStatus("Done — this verdict is authoritative over the instant check.");
  } catch (err) {
    console.error(err);
    setStatus("The stronger check failed to load/run. The instant band above still stands.");
    els.strong.disabled = false;
  }
});

/** Map the model's [{label, score}] output to a 0..1 "looks synthetic" score. */
function syntheticProbability(out: Array<{ label: string; score: number }>): number {
  const fake = out.find((o) => /fake|spoof|synthetic|\b0\b/i.test(o.label));
  if (fake) return fake.score;
  const real = out.find((o) => /real|bona|genuine|human|\b1\b/i.test(o.label));
  if (real) return 1 - real.score;
  // Fallback: assume the top label is the positive class.
  return out[0]?.score ?? 0.5;
}

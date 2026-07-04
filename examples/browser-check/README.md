# browser-check

A tiny Vite app showing the full VoiceCheck pattern **in the browser**:

1. record from the mic or upload a clip,
2. decode it to 16 kHz mono PCM,
3. get an **instant** confidence band from a lightweight heuristic,
4. optionally tap **"Run the stronger AI check"** to download a real model
   (`as1605/Deepfake-audio-detection-V2`, ~379 MB, cached after first use) and run it
   **on-device** via [`@huggingface/transformers`](https://github.com/huggingface/transformers.js).

Your audio never leaves the page.

## Run it

```bash
cd examples/browser-check
npm install
npm run dev
```

Then open the printed local URL. Recording needs microphone permission and a secure context
(`localhost` counts).

## Notes / honesty

- This example is **self-contained** so it runs without the (not-yet-published) workspace
  packages. The instant band uses `src/voicecheck-lite.ts` — a deliberately minimal
  **teaching stand-in**, not the production heuristic. The real, honest heuristic is
  [`@mosadd/voice-analyzer-core`](../../packages/voice-analyzer-core), and the real fusion +
  band/disclaimer logic is [`@mosadd/voicecheck`](../../packages/voicecheck). Once those are
  on npm, swap the lite module for them.
- The bands and the "signal, not a verdict" disclaimer here are kept identical to the real
  package. Results are a **signal, not a verdict** — see the repository's model cards for the
  limitations (unbenchmarked accuracy, codec-compression sensitivity, not for legal use).
- The first run of the stronger check downloads ~379 MB. That's expected; it's the
  unquantized model (shrinking it is on the roadmap).

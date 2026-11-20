# Hookcut

AI clipping that runs in the browser: drop a long video, get captioned, reframed, scored vertical Shorts. No upload, no credits, no watermark.

- Spec: `docs/PRD.md`. Marketing plan: `docs/MARKETING.md`.
- Stack: Next.js 16 (App Router), Tailwind 4, mediabunny (WebCodecs decode/encode), transformers.js Whisper (WebGPU, WASM fallback) in a Web Worker, MediaPipe face detection, AI SDK + Vercel AI Gateway for the optional `/api/rank`.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
npm run lint
```

## End-to-end test

Runs in installed Google Chrome (H.264 needs proprietary codecs).

```bash
TEST_VIDEO=/path/to/2-3-minute-talk.mp4 BASE_URL=http://localhost:3100 npx playwright test
```

The test uploads the video, waits for scored clips, edits a caption word, switches layout, exports, then checks the MP4 with ffprobe (1080x1920, audio track, expected duration) and saves sample frames to `e2e/out/`.

## Where things live

- `src/lib/asr/worker.ts`: audio decode, 16 kHz resample, energy envelope, chunked Whisper with word timestamps.
- `src/lib/clips/score.ts`: sentence-aligned candidate windows, seven signals, non-max suppression.
- `src/lib/captions/`: presets and the canvas caption renderer (shared by preview and export).
- `src/lib/reframe/layout.ts`: face-tracked camera path and the four layouts.
- `src/lib/media/export.ts`: mediabunny Conversion with a `process` callback, spliced AAC audio.
- `src/app/api/rank/route.ts`: rate-limited LLM re-rank, transcript text only, silent fallback.

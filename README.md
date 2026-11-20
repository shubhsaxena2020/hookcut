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
TEST_VIDEO=/path/to/2-3-minute-talk.mp4 TEST_VIDEO_EN=/path/to/english-speech.mp4 TEST_VIDEO_ES=/path/to/spanish-speech.mp4 BASE_URL=http://localhost:3100 npx playwright test
```

`studio.spec.ts` uploads the English video, waits for scored clips, checks the auto-detected language, edits a caption word, switches layout, turns on the end card with a referral code, exports, then checks the MP4 with ffprobe (1080x1920, audio track, clip length plus 1.5 s) and that it rendered in the export worker. `language.spec.ts` checks that auto-detect recognises English and Spanish (each skipped without its video). Output lands in `e2e/out/`; the last run's evidence is in `docs/e2e/`, and Lighthouse numbers are in `docs/lighthouse/`.

## Analytics

`<Analytics />` from `@vercel/analytics` records cookieless page views (query strings are cut down to `ref` and `utm_*`). The studio's custom events (`studio_open`, `video_loaded`, `clips_found`, `export_done`, coarse buckets only) are off by default because Vercel only records custom events on Pro and Enterprise plans. Set `NEXT_PUBLIC_ANALYTICS_EVENTS=1` at build time to turn them on.

## Where things live

- `src/lib/asr/worker.ts`: audio decode, 16 kHz resample, energy envelope, Whisper language detection, chunked Whisper with word timestamps.
- `src/lib/clips/score.ts`: sentence-aligned candidate windows, seven signals, non-max suppression.
- `src/lib/captions/`: presets and the canvas caption renderer (shared by preview and export), including the end card.
- `src/lib/reframe/layout.ts`: face-tracked camera path and the four layouts.
- `src/lib/media/render.ts`: frame-accurate clip render (CanvasSink, CanvasSource encoder, spliced AAC audio, optional end card).
- `src/lib/media/export.worker.ts` and `export.ts`: run the render in a Web Worker, falling back to the main thread.
- `src/lib/compare.ts`, `src/lib/usecases.ts`: data for the `/vs/*` and use-case landing pages, with sources.
- `src/app/api/rank/route.ts`: rate-limited LLM re-rank, transcript text only, silent fallback.

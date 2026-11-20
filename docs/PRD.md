# Hookcut: product spec (v1)

> AI clipping that runs in your browser. Drop a long video, and you get the best vertical Shorts:
> captioned, reframed and scored, in minutes, with no upload, no credits and no watermark.

Hookcut is an original product: its own name, brand and design. It competes with Opus Clip,
Vizard, Klap, Submagic and Quso on features. It must not copy any competitor's name, logo, copy,
layout or visual identity.

## 1. Market research (2026-11-20)
- **Opus Clip** is the category leader.
  - Pricing: Free (60 credits a month, watermark), Starter $15/mo, Pro $29/mo (300 credits per pack), Business custom (API only on Business). 1 credit ≈ 1 source minute. Credits expire.
  - Sources: castmagic.io/blog/opus-clip-pricing, quso.ai/blog/opus-clip-pricing.
- **Known Opus Clip weaknesses** (eesel.ai review, G2, Trustpilot 2025–26):
  - captions "often full of mistakes", edited captions drift out of sync (~85–90% accuracy);
  - clip picks "hit or miss" and sometimes from the wrong parts;
  - processing hangs for hours, wrong ETA, pixelated renders;
  - billing after cancellation, slow support;
  - credit system confusing; uploads plus waiting in a queue.
- **Competitors:**
  - Vizard: value; virality score and reframe at about half the cost.
  - Klap: visual polish, podcasts.
  - Submagic: captions; AI clipping is a $19 add-on.
  - Quso (ex-vidyo.ai): clipping plus scheduling.
- **Gap Hookcut owns:** caption accuracy you can fix without drift, explainable clip picks, instant start (no upload or queue), privacy, no credits, transparent free core, and gaming/streamer layouts (facecam stacked) that general tools handle badly.

## 2. Architecture: client-first (that's why it fits Vercel)
All heavy work runs on the user's machine in the browser, so there are no GPU servers, nothing to
upload, and the core costs us nothing:

| Stage | Tech (browser) |
|---|---|
| Decode / trim / crop / encode / mux | `mediabunny` (WebCodecs; hardware encode; MP4 H.264 + AAC) |
| Transcription with word timestamps | `@huggingface/transformers` Whisper (WebGPU, WASM fallback), in a Web Worker, chunked with progress; model choice tiny/base/small; language auto plus 20+ languages |
| Audio signals | Web Audio RMS energy, peaks, laughter/cheer heuristics, silence map |
| Visual signals | `@mediapipe/tasks-vision` face detector at a low sample rate (2 fps) to drive reframing; scene cuts by frame-difference |
| Clip finding | Multi-signal scorer (below), plus optional LLM re-rank |
| Captions | Canvas renderer drawn onto each frame during export (mediabunny Conversion `video.process`) |
| Storage | IndexedDB (projects, transcripts, renders); nothing leaves the device |

**Server, Vercel, minimal:**
- `POST /api/rank` sends ONLY transcript text (never video) to an LLM through the Vercel AI Gateway (`ai` SDK, a small fast model). It returns per-candidate hook and title suggestions and a 0–100 "virality" with reasons.
  - Rate-limited per IP; if the gateway is unavailable, the heuristic scorer alone is used.
  - A clear privacy note in the UI tells users this step sends transcript text only.
- Marketing pages are static/ISR. There is no database in v1, and no auth in v1: the app works without an account.

## 3. Clip finding: better than "hit or miss"
1. **Candidate windows:** sentence-aligned spans of 15–60 s (user-selectable 15/30/60/90 presets). Each starts on a sentence start and ends on a sentence end; no mid-word cuts; 0.2 s padding.
2. **Signals per window**, each normalized 0–1:
   - **Hook:** first 3 s contain a question, exclamation, number, "wait/no way/watch this", a strong emotion word, or a direct address.
   - **Payoff:** a punchline or reaction near the end (energy spike, laughter, exclamation).
   - **Energy:** mean and peak RMS relative to the whole video, speech rate.
   - **Emotion:** lexicon intensity.
   - **Completeness:** it reads as a full thought; penalize dangling pronouns at the start ("so", "and", "he").
   - **Novelty:** TF-IDF keyword salience vs the rest of the video.
   - **Visual:** face present, number of scene changes.
3. Score = weighted sum, then non-max suppression (no overlapping clips), top N.
4. Optional LLM re-rank adds titles, hooks and a reason line.
5. **Explainable score:** every clip shows "Why this clip" with the signal bars. Users can drag the start/end and the score updates live.

## 4. Features (v1 must-have; ✓ = beats or matches Opus)
- ✓ Upload MP4/MOV/WebM/MKV (up to about 2 h, chunked) or paste a direct video URL with CORS. YouTube URLs: show an honest message that downloading YouTube is not supported in-browser.
- ✓ Auto-find 5–20 clips with a virality score of 0–100, plus reasons.
- ✓ Word-level animated captions with 8+ style presets:
  - Bold Pop, Karaoke highlight, Minimal, Neon, Boxed, Gaming, Hormozi-style big words (named originally), Subtle lower-third.
  - Options: emoji auto-insert toggle, keyword color emphasis, 1–3 words per line, position, font, size, stroke, shadow.
- ✓ Caption editor:
  - edit words inline; timing stays locked to word timestamps, so there is no drift;
  - split and merge lines;
  - find and replace;
  - profanity filter.
- ✓ AI reframe to 9:16, 1:1 or 4:5 with modes:
  - Auto (face-tracked, smoothed);
  - Center;
  - Fit with blurred background;
  - **Stacked** (gameplay plus facecam box: the user drags a box over the webcam once and it is reused for all clips). This is the streamer layout competitors lack.
- ✓ Trim and extend each clip on a mini timeline with waveform and word track; remove filler words and silences toggle (auto-cut "um/uh" and gaps over 0.6 s).
- ✓ Title and hook text overlay for the first 3 s (from the LLM or heuristic); a progress bar overlay option.
- ✓ Brand kit, saved locally: logo watermark of the user's own, colors, font, caption default.
- ✓ Export MP4 1080×1920 at 30/60 fps, hardware-encoded; batch "export all"; SRT/VTT export; copy title, description and hashtags.
- ✓ Projects saved in the browser; resume later.
- ✓ No watermark, no credits, unlimited.
- ✓ Fast: show the first clip candidates while transcription is still running (progressive).

**Later, v2 (design for it, don't build now):** accounts and cloud sync, direct posting to YouTube, TikTok and IG, team workspaces, an API, B-roll, AI voice dubbing.

## 5. Pages
- `/` landing page:
  - hero with a live demo animation;
  - "how it works" (3 steps);
  - feature grid;
  - comparison table (Hookcut vs "typical cloud clippers", factual, no competitor logos);
  - privacy section;
  - FAQ;
  - CTA.
- `/app` the studio: drop zone → processing (stage progress with honest ETA) → clips grid (score, preview, reasons) → clip editor (preview canvas, captions, layout, trim, styles) → export.
- `/pricing`: Free (everything above). "Pro" is coming soon, with a waitlist email field stored nowhere in v1, or a mailto. Keep it honest.
- `/privacy`, `/terms`, `/changelog`, `/blog` with 2 seeded SEO articles written originally, e.g. "How to find the best moments in a 2-hour stream".
- SEO: metadata, OG images (next/og), sitemap, robots, JSON-LD SoftwareApplication.

## 6. Quality bar
- An original, premium design; it must not resemble any competitor.
- Responsive; the studio is desktop-first but usable on a tablet.
- Graceful capability detection: WebGPU → WASM fallback; WebCodecs required (Chrome/Edge/Safari 17+). If missing, show a clear message.
- Workers for transcription and encoding, so the UI never freezes; cancel buttons everywhere.
- Accessibility: keyboard shortcuts in the editor (space play, J/K/L, I/O set in/out), focus states.
- Lighthouse on the landing page: Performance ≥ 90, Accessibility ≥ 95.
- **E2E tests (Playwright):** upload a short sample video (generate a 2-minute test clip with ffmpeg: speech TTS or a public-domain clip) → clips appear → edit a caption → export → the downloaded MP4 is 1080×1920 with an audio track and correct duration.

## 7. Deployment
- Vercel project `hookcut` on team `shubh-saxena-s-projects`; the URL is `hookcut.vercel.app` if free.
- COOP/COEP headers are only needed if WASM threads are used; prefer settings that work without SharedArrayBuffer, or set the headers on `/app` only.
- Repo: `C:\Users\shubh\Projects\hookcut` (own git repo, then a private GitHub repo `hookcut`).

/**
 * Clip rendering, shared by the export Web Worker and the main-thread fallback.
 *
 * Video: the source is decoded at exactly the source time behind each output
 * frame, so filler and silence cuts and frame-rate changes fall out of one time
 * map (rotated sources go through CanvasSink so they come out upright). Each frame is reframed, captioned and handed to a
 * CanvasSource encoder; the optional end card is appended after the last frame.
 * Audio: the kept segments are spliced into one AAC track, padded with silence
 * under the end card.
 */
import {
  ALL_FORMATS,
  AudioSample,
  AudioSampleSink,
  AudioSampleSource,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Input,
  type InputVideoTrack,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSampleSink,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import type { Clip, FaceSample, Word } from "@/lib/types";
import { ASPECTS, loadCaptionFonts } from "@/lib/captions/presets";
import { END_CARD_SECONDS, buildLines, drawCaptions, drawEndCard, drawHook, drawLogo, drawProgress } from "@/lib/captions/render";
import { cameraPath, camAt, drawFrame } from "@/lib/reframe/layout";
import { keptSegments, outDuration, outToSrc } from "@/lib/clips/segments";

export type RenderJob = {
  file: Blob;
  clip: Clip;
  words: Word[];
  faces: FaceSample[];
  logo?: ImageBitmap | null;
  accent: string;
  /** end card URL text (with ?ref= when chosen), or null for no end card */
  endCard: string | null;
};

export class ExportCanceled extends Error {}

type Ctx2D = CanvasRenderingContext2D;

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

type SourceFrame = { img: CanvasImageSource; w: number; h: number; release: () => void };

/**
 * The source frame shown at each timestamp. Unrotated video (the usual case) is
 * drawn straight from the decoded frame; rotated or flipped video goes through
 * CanvasSink, which applies the rotation at the cost of one extra copy per frame.
 */
async function* sourceFrames(track: InputVideoTrack, ts: Iterable<number>): AsyncGenerator<SourceFrame | null> {
  if (track.rotation === 0 && !(await track.getFlip())) {
    for await (const s of new VideoSampleSink(track).samplesAtTimestamps(ts)) {
      // repeated timestamps yield clones, so every sample can be closed after drawing
      yield s ? { img: s.toCanvasImageSource(), w: s.displayWidth, h: s.displayHeight, release: () => s.close() } : null;
    }
    return;
  }
  for await (const wc of new CanvasSink(track, { poolSize: 2 }).canvasesAtTimestamps(ts)) {
    yield wc ? { img: wc.canvas, w: wc.canvas.width, h: wc.canvas.height, release: () => undefined } : null;
  }
}

/** Hardware encoder first; some GPUs reject 1080x1920 or 60 fps, so retry in software. */
export async function renderClip(job: RenderJob, onProgress: (p: number) => void, signal?: AbortSignal): Promise<Blob> {
  try {
    return await renderOnce(job, "prefer-hardware", onProgress, signal);
  } catch (err) {
    if (err instanceof ExportCanceled || signal?.aborted) throw err;
    console.warn("Hardware encode failed, retrying with software encoder", err);
    onProgress(0);
    return renderOnce(job, "no-preference", onProgress, signal);
  }
}

async function renderOnce(
  job: RenderJob,
  hw: "prefer-hardware" | "no-preference",
  onProgress: (p: number) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  const check = () => {
    if (signal?.aborted) throw new ExportCanceled("Export canceled");
  };
  const { clip, words, faces } = job;
  await loadCaptionFonts();
  const { w: W, h: H } = ASPECTS[clip.layout.aspect];
  const fps = clip.fps;
  const segs = keptSegments(words, clip);
  const total = outDuration(segs);
  if (total < 0.5) throw new Error("This clip is shorter than half a second after cuts.");
  const lines = buildLines(words, clip);
  const cam = clip.layout.mode === "auto" ? cameraPath(faces, clip.start, clip.end) : null;
  const clipFrames = Math.max(1, Math.round(total * fps));
  const endFrames = job.endCard ? Math.round(END_CARD_SECONDS * fps) : 0;
  const outTotal = (clipFrames + endFrames) / fps;

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(job.file) });
  const maybeTrack = await input.getPrimaryVideoTrack();
  if (!maybeTrack) throw new Error("No video track was found in this file.");
  const videoTrack: InputVideoTrack = maybeTrack;

  const codec = (await canEncodeVideo("avc", { width: W, height: H, frameRate: fps }))
    ? "avc"
    : (await canEncodeVideo("vp9", { width: W, height: H }))
      ? "vp9"
      : null;
  if (!codec) throw new Error("This browser cannot encode video. Try a recent Chrome or Edge.");

  const canvas = makeCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as Ctx2D;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const videoSource = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH, hardwareAcceleration: hw });
  output.addVideoTrack(videoSource, { frameRate: fps });
  try {
    return await encode();
  } catch (err) {
    await output.cancel().catch(() => undefined);
    throw err;
  }

  async function encode(): Promise<Blob> {
  // Audio: decode the clip range and splice in only the kept segments
  const audioTrack = await input.getPrimaryAudioTrack();
  let audio: { source: AudioSampleSource; planes: Float32Array[]; rate: number } | null = null;
  if (audioTrack && (await audioTrack.canDecode())) {
    const rate = audioTrack.sampleRate;
    const chans = Math.min(2, audioTrack.numberOfChannels);
    const acodec = (await canEncodeAudio("aac", { numberOfChannels: chans, sampleRate: rate }))
      ? "aac"
      : (await canEncodeAudio("opus", { numberOfChannels: chans, sampleRate: 48000 }))
        ? "opus"
        : null;
    if (acodec) {
      const clipN = Math.ceil(total * rate);
      const n = Math.ceil(outTotal * rate) + 1; // silence under the end card
      const planes = Array.from({ length: chans }, () => new Float32Array(n));
      // AudioSampleSink (WebCodecs AudioData) works in workers; Web Audio's AudioBuffer does not
      const sink = new AudioSampleSink(audioTrack);
      for await (const sample of sink.samples(clip.start, clip.end)) {
        check();
        const timestamp = sample.timestamp;
        const bRate = sample.sampleRate;
        const frames = sample.numberOfFrames;
        const srcChans = sample.numberOfChannels;
        const data: Float32Array[] = [];
        for (let c = 0; c < Math.min(chans, srcChans); c++) {
          const opts = { planeIndex: c, format: "f32-planar" as const };
          const d = new Float32Array(sample.allocationSize(opts) / 4);
          sample.copyTo(d, opts);
          data.push(d);
        }
        sample.close();
        for (const s of segs) {
          const a = Math.max(s.a, timestamp);
          const b = Math.min(s.b, timestamp + frames / bRate);
          if (b <= a) continue;
          const srcOff = Math.floor((a - timestamp) * bRate);
          const len = Math.floor((b - a) * bRate);
          const dstOff = Math.floor((s.out + (a - s.a)) * rate);
          for (let c = 0; c < chans; c++) {
            const src = data[Math.min(c, data.length - 1)];
            const plane = planes[c];
            for (let k = 0; k < len && dstOff + k < clipN && srcOff + k < src.length; k++) plane[dstOff + k] = src[srcOff + k];
          }
        }
      }
      // 8 ms fades at each join, and at the end of the clip, to avoid clicks
      const fade = Math.floor(rate * 0.008);
      const joins = segs.slice(1).map((s) => Math.floor(s.out * rate));
      for (const p of planes) {
        for (const at of joins) {
          for (let k = 0; k < fade; k++) {
            const g = k / fade;
            if (at - 1 - k >= 0) p[at - 1 - k] *= g;
            if (at + k < n) p[at + k] *= g;
          }
        }
        for (let k = 0; k < fade && clipN - 1 - k >= 0; k++) p[clipN - 1 - k] *= k / fade;
      }
      const source = new AudioSampleSource({ codec: acodec, quality: QUALITY_HIGH });
      output.addAudioTrack(source);
      audio = { source, planes, rate };
    }
  }

  await output.start();
  if (audio) {
    const { source, planes, rate } = audio;
    const n = planes[0].length;
    for (let off = 0; off < n; off += rate) {
      const len = Math.min(rate, n - off);
      const data = new Float32Array(len * planes.length);
      planes.forEach((p, c) => data.set(p.subarray(off, off + len), c * len));
      const s = new AudioSample({ data, format: "f32-planar", numberOfChannels: planes.length, sampleRate: rate, timestamp: off / rate });
      await source.add(s);
      s.close();
    }
    source.close();
  }

  // Video: one source lookup per output frame
  function* times() {
    for (let k = 0; k < clipFrames; k++) yield outToSrc(segs, k / fps);
  }
  const frames = clipFrames + endFrames;
  let k = 0;
  for await (const f of sourceFrames(videoTrack, times())) {
    check();
    const ot = k / fps;
    const srcT = outToSrc(segs, ot);
    if (f) {
      try {
        drawFrame(ctx, f.img, f.w, f.h, W, H, clip.layout, camAt(cam, srcT));
      } finally {
        f.release();
      }
    } else {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
    }
    drawCaptions(ctx, W, H, lines, srcT, clip.captions);
    if (clip.showHook) drawHook(ctx, W, H, clip.hook || clip.title, ot);
    if (clip.showProgress) drawProgress(ctx, W, H, ot / total, job.accent);
    if (job.logo) drawLogo(ctx, W, H, job.logo);
    await videoSource.add(ot, 1 / fps);
    k++;
    if (k % 5 === 0) onProgress(k / frames);
    if (k >= clipFrames) break;
  }
  for (let j = 0; j < endFrames; j++) {
    check();
    drawEndCard(ctx, W, H, j / fps, job.endCard!);
    await videoSource.add((clipFrames + j) / fps, 1 / fps);
    if (j % 5 === 0) onProgress((clipFrames + j) / frames);
  }
  videoSource.close();
  check();
  await output.finalize();
  onProgress(1);
  const buf = (output.target as BufferTarget).buffer;
  if (!buf) throw new Error("The encoder produced no data.");
  return new Blob([buf], { type: "video/mp4" });
  }
}

"use client";
/**
 * Clip export: mediabunny Conversion with a video `process` callback that draws the
 * reframed frame plus captions on a canvas, and an AAC audio track built from the
 * kept segments (so filler and silence cuts stay in sync with the picture).
 */
import {
  ALL_FORMATS,
  AudioBufferSink,
  AudioSample,
  AudioSampleSource,
  BlobSource,
  BufferTarget,
  Conversion,
  Input,
  Mp4OutputFormat,
  Output,
  QUALITY_HIGH,
  VideoSample,
  canEncodeAudio,
  canEncodeVideo,
} from "mediabunny";
import type { Clip, FaceSample, Word } from "@/lib/types";
import { ASPECTS, loadCaptionFonts } from "@/lib/captions/presets";
import { buildLines, drawCaptions, drawHook, drawLogo, drawProgress } from "@/lib/captions/render";
import { cameraPath, camAt, drawFrame } from "@/lib/reframe/layout";
import { keptSegments, outDuration, srcToOut } from "@/lib/clips/segments";

export type ExportJob = {
  file: Blob;
  clip: Clip;
  words: Word[];
  faces: FaceSample[];
  srcWidth: number;
  srcHeight: number;
  logo?: HTMLImageElement | null;
  accent: string;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
};

export class ExportCanceled extends Error {}

/**
 * Try the hardware encoder first; some GPUs reject 1080x1920 (portrait) or
 * 60 fps, so fall back to the browser's software encoder on failure.
 */
export async function exportClip(job: ExportJob): Promise<Blob> {
  try {
    return await exportOnce(job, "prefer-hardware");
  } catch (err) {
    if (err instanceof ExportCanceled || job.signal?.aborted) throw err;
    console.warn("Hardware encode failed, retrying with software encoder", err);
    job.onProgress?.(0);
    return exportOnce(job, "no-preference");
  }
}

async function exportOnce(job: ExportJob, hw: "prefer-hardware" | "no-preference"): Promise<Blob> {
  const { clip, words, faces } = job;
  await loadCaptionFonts();
  const { w: W, h: H } = ASPECTS[clip.layout.aspect];
  const fps = clip.fps;
  const segs = keptSegments(words, clip);
  const total = outDuration(segs);
  if (total < 0.5) throw new Error("This clip is shorter than half a second after cuts.");
  const lines = buildLines(words, clip);
  const cam = clip.layout.mode === "auto" ? cameraPath(faces, clip.start, clip.end) : null;

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(job.file) });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget(),
  });

  const videoCodec = (await canEncodeVideo("avc", { width: W, height: H, frameRate: fps }))
    ? "avc"
    : (await canEncodeVideo("vp9", { width: W, height: H }))
      ? "vp9"
      : null;
  if (!videoCodec) throw new Error("This browser cannot encode video. Try a recent Chrome or Edge.");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const relStart = clip.start;
  let relative: boolean | null = null;
  let lastOut = -1;

  const conversion = await Conversion.init({
    input,
    output,
    composable: true,
    trim: { start: clip.start, end: clip.end },
    audio: { discard: true },
    video: {
      codec: videoCodec,
      frameRate: fps,
      quality: QUALITY_HIGH,
      forceTranscode: true,
      hardwareAcceleration: hw,
      processedWidth: W,
      processedHeight: H,
      process: (sample) => {
        if (relative === null) relative = sample.timestamp < relStart - 0.3;
        const srcT = relative ? sample.timestamp + relStart : sample.timestamp;
        const outT = srcToOut(segs, srcT);
        if (outT === null) return null;
        // keep timestamps strictly increasing on the frame grid
        const ot = Math.round(outT * fps) / fps;
        if (ot <= lastOut) return null;
        lastOut = ot;
        const img = sample.toCanvasImageSource();
        drawFrame(ctx, img, sample.displayWidth || job.srcWidth, sample.displayHeight || job.srcHeight, W, H, clip.layout, camAt(cam, srcT));
        drawCaptions(ctx, W, H, lines, srcT, clip.captions);
        if (clip.showHook) drawHook(ctx, W, H, clip.hook || clip.title, ot);
        if (clip.showProgress) drawProgress(ctx, W, H, ot / total, job.accent);
        if (job.logo) drawLogo(ctx, W, H, job.logo);
        return new VideoSample(canvas, { timestamp: ot, duration: 1 / fps });
      },
    },
  });

  // Audio: decode the clip range and splice in only the kept segments
  const audioTrack = await input.getPrimaryAudioTrack();
  let audioSource: AudioSampleSource | null = null;
  let audioData: { planes: Float32Array[]; rate: number } | null = null;
  if (audioTrack && (await audioTrack.canDecode())) {
    const rate = audioTrack.sampleRate;
    const chans = Math.min(2, audioTrack.numberOfChannels);
    const codec = (await canEncodeAudio("aac", { numberOfChannels: chans, sampleRate: rate }))
      ? "aac"
      : (await canEncodeAudio("opus", { numberOfChannels: chans, sampleRate: 48000 }))
        ? "opus"
        : null;
    if (codec) {
      const n = Math.ceil(total * rate) + 1;
      const planes = Array.from({ length: chans }, () => new Float32Array(n));
      const sink = new AudioBufferSink(audioTrack);
      for await (const { buffer, timestamp } of sink.buffers(clip.start, clip.end)) {
        if (job.signal?.aborted) throw new ExportCanceled("Export canceled");
        const bRate = buffer.sampleRate;
        for (const s of segs) {
          const a = Math.max(s.a, timestamp);
          const b = Math.min(s.b, timestamp + buffer.duration);
          if (b <= a) continue;
          const srcOff = Math.floor((a - timestamp) * bRate);
          const len = Math.floor((b - a) * bRate);
          const dstOff = Math.floor((s.out + (a - s.a)) * rate);
          for (let c = 0; c < chans; c++) {
            const data = buffer.getChannelData(Math.min(c, buffer.numberOfChannels - 1));
            const plane = planes[c];
            for (let k = 0; k < len && dstOff + k < n; k++) plane[dstOff + k] = data[srcOff + k];
          }
        }
      }
      // 8 ms fades at each join to avoid clicks
      const fade = Math.floor(rate * 0.008);
      for (const s of segs.slice(1)) {
        const at = Math.floor(s.out * rate);
        for (const p of planes) {
          for (let k = 0; k < fade; k++) {
            const g = k / fade;
            if (at - 1 - k >= 0) p[at - 1 - k] *= g;
            if (at + k < n) p[at + k] *= g;
          }
        }
      }
      audioData = { planes, rate };
      audioSource = new AudioSampleSource({ codec, quality: QUALITY_HIGH });
      output.addAudioTrack(audioSource);
    }
  }

  const onAbort = () => void conversion.cancel();
  job.signal?.addEventListener("abort", onAbort);
  conversion.onProgress = (p) => job.onProgress?.(p);

  await output.start();
  if (audioSource && audioData) {
    const { planes, rate } = audioData;
    const chunk = rate; // 1 s per sample
    const n = planes[0].length;
    for (let off = 0; off < n; off += chunk) {
      const len = Math.min(chunk, n - off);
      const data = new Float32Array(len * planes.length);
      planes.forEach((p, c) => data.set(p.subarray(off, off + len), c * len));
      const s = new AudioSample({
        data,
        format: "f32-planar",
        numberOfChannels: planes.length,
        sampleRate: rate,
        timestamp: off / rate,
      });
      await audioSource.add(s);
      s.close();
    }
    audioSource.close();
  }
  try {
    await conversion.execute();
  } catch (err) {
    if (job.signal?.aborted) throw new ExportCanceled("Export canceled");
    throw err;
  } finally {
    job.signal?.removeEventListener("abort", onAbort);
  }
  await output.finalize();
  const buf = (output.target as BufferTarget).buffer;
  if (!buf) throw new Error("The encoder produced no data.");
  return new Blob([buf], { type: "video/mp4" });
}

export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function safeName(s: string) {
  return (s || "clip").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 60).toLowerCase() || "clip";
}

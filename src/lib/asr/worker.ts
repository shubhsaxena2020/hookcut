/// <reference lib="webworker" />
/**
 * Transcription worker: decodes the audio track with mediabunny, resamples it to
 * 16 kHz mono, computes an energy envelope, then runs Whisper (transformers.js)
 * chunk by chunk with word-level timestamps, posting words as they arrive.
 */
import { ALL_FORMATS, AudioSampleSink, BlobSource, Input } from "mediabunny";
import type { AsrEvent, AsrRequest } from "./protocol";
import type { Word } from "@/lib/types";

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const SR = 16000;
const post = (e: AsrEvent, transfer: Transferable[] = []) => ctx.postMessage(e, transfer);

ctx.onmessage = async (ev: MessageEvent<AsrRequest>) => {
  if (ev.data.type !== "start") return;
  try {
    await run(ev.data);
  } catch (err) {
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};

async function decodeAudio(file: Blob) {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const track = await input.getPrimaryAudioTrack();
  if (!track) throw new Error("This video has no audio track, so there is nothing to transcribe.");
  if (!(await track.canDecode()))
    throw new Error(`Your browser cannot decode this audio codec (${track.codec ?? "unknown"}).`);
  const duration = await input.computeDuration();
  const srcRate = track.sampleRate;
  const ratio = srcRate / SR;
  let out = new Float32Array(Math.ceil(duration * SR) + SR);
  let outIdx = 0;
  let acc = 0;
  let accN = 0;
  let g = 0; // global source sample index
  let started = false;
  const sink = new AudioSampleSink(track);
  let lastReport = 0;
  for await (const sample of sink.samples()) {
    if (!started) {
      g = Math.max(0, Math.round(sample.timestamp * srcRate));
      outIdx = Math.floor(g / ratio);
      started = true;
    }
    const n = sample.numberOfFrames;
    const ch = sample.numberOfChannels;
    const opts = { planeIndex: 0, format: "f32-planar" as const };
    const mono = new Float32Array(n);
    const tmp = new Float32Array(sample.allocationSize(opts) / 4);
    for (let c = 0; c < ch; c++) {
      sample.copyTo(tmp, { planeIndex: c, format: "f32-planar" });
      for (let i = 0; i < n; i++) mono[i] += tmp[i] / ch;
    }
    const ts = sample.timestamp;
    sample.close();
    // box-filter downsample (cheap anti-aliasing)
    for (let i = 0; i < n; i++, g++) {
      const k = Math.floor(g / ratio);
      if (k !== outIdx && accN > 0) {
        if (outIdx >= out.length) {
          const bigger = new Float32Array(Math.ceil(out.length * 1.25));
          bigger.set(out);
          out = bigger;
        }
        out[outIdx] = acc / accN;
        acc = 0;
        accN = 0;
        outIdx = k;
      } else if (accN === 0) {
        outIdx = k;
      }
      acc += mono[i];
      accN++;
    }
    if (ts - lastReport > 5) {
      lastReport = ts;
      post({ type: "stage", stage: "decode", progress: Math.min(1, ts / duration) });
    }
  }
  if (accN > 0 && outIdx < out.length) out[outIdx++] = acc / accN;
  const pcm = out.subarray(0, Math.min(out.length, Math.max(outIdx, Math.floor(duration * SR))));
  return { pcm, duration };
}

function energyEnvelope(pcm: Float32Array) {
  const hop = SR / 10;
  const n = Math.ceil(pcm.length / hop);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const a = i * hop;
    const b = Math.min(pcm.length, a + hop);
    for (let j = a; j < b; j++) s += pcm[j] * pcm[j];
    env[i] = Math.sqrt(s / Math.max(1, b - a));
  }
  return env;
}

/** Split into <=30 s chunks, cutting at the quietest 100 ms near each boundary. */
function chunkBounds(env: Float32Array, duration: number) {
  const bounds: [number, number][] = [];
  let start = 0;
  while (start < duration - 0.3) {
    if (duration - start <= 30) {
      bounds.push([start, duration]);
      break;
    }
    let best = start + 29.5;
    let bestE = Infinity;
    for (let t = start + 22; t <= start + 29.5; t += 0.1) {
      const e = env[Math.floor(t * 10)] ?? 0;
      if (e < bestE) {
        bestE = e;
        best = t;
      }
    }
    bounds.push([start, best]);
    start = best;
  }
  return bounds;
}

async function pickDevice(): Promise<"webgpu" | "wasm"> {
  try {
    const gpu = (navigator as unknown as { gpu?: { requestAdapter(): Promise<unknown> } }).gpu;
    if (gpu && (await gpu.requestAdapter())) return "webgpu";
  } catch {
    /* fall through */
  }
  return "wasm";
}

async function run(req: AsrRequest) {
  post({ type: "stage", stage: "decode", progress: 0 });
  const { pcm, duration } = await decodeAudio(req.file);
  const energy = energyEnvelope(pcm);
  post({ type: "audio", duration, energy: energy.slice() });
  post({ type: "stage", stage: "decode", progress: 1 });
  if (req.audioOnly) {
    post({ type: "done" });
    return;
  }

  const { pipeline, env } = await import("@huggingface/transformers");
  env.allowLocalModels = false;

  const english = req.lang === "en";
  const modelId = `onnx-community/whisper-${req.model}${english ? ".en" : ""}_timestamped`;
  let device = await pickDevice();
  const files = new Map<string, { loaded: number; total: number }>();
  const progress_callback = (p: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (p.status === "progress" && p.file && p.total) {
      files.set(p.file, { loaded: p.loaded ?? 0, total: p.total });
      let l = 0;
      let t = 0;
      for (const f of files.values()) {
        l += f.loaded;
        t += f.total;
      }
      post({
        type: "stage",
        stage: "model",
        progress: t ? l / t : 0,
        detail: `${(l / 1e6).toFixed(0)} of ${(t / 1e6).toFixed(0)} MB`,
      });
    }
  };
  post({ type: "stage", stage: "model", progress: 0 });

  type Transcriber = (
    audio: Float32Array,
    opts: Record<string, unknown>,
  ) => Promise<{ text: string; chunks?: { text: string; timestamp: [number, number | null] }[] }>;

  let transcriber: Transcriber;
  const load = async (dev: "webgpu" | "wasm") =>
    (await pipeline("automatic-speech-recognition", modelId, {
      device: dev,
      dtype:
        dev === "webgpu"
          ? { encoder_model: "fp32", decoder_model_merged: "q4" }
          : { encoder_model: "q8", decoder_model_merged: "q8" },
      progress_callback,
    })) as unknown as Transcriber;
  try {
    transcriber = await load(device);
  } catch (err) {
    if (device !== "webgpu") throw err;
    device = "wasm";
    transcriber = await load(device);
  }
  post({ type: "device", device });
  post({ type: "stage", stage: "model", progress: 1 });

  const bounds = chunkBounds(energy, duration);
  let id = 0;
  for (let i = 0; i < bounds.length; i++) {
    const [a, b] = bounds[i];
    post({ type: "stage", stage: "transcribe", progress: a / duration });
    const slice = pcm.subarray(Math.floor(a * SR), Math.floor(b * SR));
    // skip near-silent chunks: Whisper tends to hallucinate on silence
    let peak = 0;
    for (let k = 0; k < slice.length; k += 64) peak = Math.max(peak, Math.abs(slice[k]));
    const words: Word[] = [];
    if (peak > 0.01) {
      const opts: Record<string, unknown> = { return_timestamps: "word" };
      if (!english && req.lang !== "auto") {
        opts.language = req.lang;
        opts.task = "transcribe";
      }
      const res = await transcriber(slice, opts);
      for (const c of res.chunks ?? []) {
        const text = c.text.trim();
        if (!text) continue;
        const s = a + (c.timestamp[0] ?? 0);
        let e = a + (c.timestamp[1] ?? (c.timestamp[0] ?? 0) + 0.3);
        if (e <= s) e = s + 0.08;
        words.push({ id: id++, text, start: Math.min(s, b), end: Math.min(e, b + 0.2) });
      }
    }
    post({ type: "words", words, upTo: b });
  }
  post({ type: "stage", stage: "transcribe", progress: 1 });
  post({ type: "done" });
}

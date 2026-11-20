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

type LangModel = {
  model: ((inputs: Record<string, unknown>) => Promise<{ logits: TensorLike }>) & {
    generation_config?: { lang_to_id?: Record<string, number>; decoder_start_token_id?: number };
  };
  processor: (audio: Float32Array) => Promise<{ input_features: unknown }>;
};
type TensorLike = { data: ArrayLike<number>; dims: number[]; type: string; to?: (t: string) => TensorLike };

/**
 * Whisper language identification. transformers.js does not implement it (it
 * silently falls back to English), so do what Whisper itself does: run the
 * encoder and one decoder step from <|startoftranscript|>, then compare the
 * probabilities of the language tokens. Up to three voiced chunks are summed so
 * one music intro or a quiet opening does not decide the language alone.
 */
async function detectLanguage(transcriber: unknown, slices: Float32Array[]): Promise<string | null> {
  const t = transcriber as LangModel;
  const cfg = t.model.generation_config;
  const ids = cfg?.lang_to_id;
  if (!ids || cfg?.decoder_start_token_id == null || !slices.length) return null;
  const { Tensor } = await import("@huggingface/transformers");
  const langs = Object.entries(ids);
  const total = new Float64Array(langs.length);
  let n = 0;
  for (const slice of slices.slice(0, 3)) {
    n++;
    const { input_features } = await t.processor(slice);
    const decoder_input_ids = new Tensor("int64", BigInt64Array.from([BigInt(cfg.decoder_start_token_id)]), [1, 1]);
    let logits = (await t.model({ input_features, decoder_input_ids })).logits;
    if (logits.type !== "float32" && logits.to) logits = logits.to("float32");
    const vocab = logits.dims[logits.dims.length - 1];
    const off = logits.data.length - vocab; // last decoder position
    const vals = langs.map(([, id]) => Number(logits.data[off + id]));
    const max = Math.max(...vals);
    const exp = vals.map((v) => Math.exp(v - max));
    const sum = exp.reduce((s, v) => s + v, 0);
    exp.forEach((v, i) => (total[i] += v / sum));
    if (Math.max(...total) / n > 0.8) break; // confident enough already
  }
  let bi = 0;
  for (let i = 1; i < total.length; i++) if (total[i] > total[bi]) bi = i;
  return langs[bi][0].replace(/^<\|/, "").replace(/\|>$/, "");
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
  const sliceOf = ([a, b]: [number, number]) => pcm.subarray(Math.floor(a * SR), Math.floor(b * SR));
  // skip near-silent chunks: Whisper tends to hallucinate on silence
  const voiced = bounds.map((bd) => {
    const s = sliceOf(bd);
    let peak = 0;
    for (let k = 0; k < s.length; k += 64) peak = Math.max(peak, Math.abs(s[k]));
    return peak > 0.01;
  });

  let lang: string | null = english ? "en" : req.lang === "auto" ? null : req.lang;
  if (!english && req.lang === "auto") {
    post({ type: "stage", stage: "transcribe", progress: 0, detail: "Detecting the spoken language" });
    try {
      lang = await detectLanguage(transcriber, bounds.filter((_, i) => voiced[i]).map(sliceOf));
    } catch (err) {
      console.warn("language detection failed", err);
    }
    post({ type: "lang", lang });
  }

  let id = 0;
  for (let i = 0; i < bounds.length; i++) {
    const [a, b] = bounds[i];
    post({ type: "stage", stage: "transcribe", progress: a / duration });
    const slice = sliceOf(bounds[i]);
    const words: Word[] = [];
    if (voiced[i]) {
      const opts: Record<string, unknown> = { return_timestamps: "word" };
      if (!english && lang) {
        opts.language = lang;
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

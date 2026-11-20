"use client";
/**
 * Visual signals: face boxes (MediaPipe face detector) and scene cuts
 * (frame difference), sampled at a low rate across the whole video.
 */
import { ALL_FORMATS, BlobSource, CanvasSink, Input } from "mediabunny";
import type { FaceSample } from "@/lib/types";

const MP_VERSION = "1.2.3";
const WASM = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MP_VERSION}/wasm`;
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";

type Detector = {
  detect(img: HTMLCanvasElement): { detections: { boundingBox?: { originX: number; originY: number; width: number; height: number }; categories: { score: number }[] }[] };
  close(): void;
};

async function createDetector(): Promise<Detector | null> {
  try {
    const { FaceDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
    const fileset = await FilesetResolver.forVisionTasks(WASM);
    const make = (delegate: "GPU" | "CPU") =>
      FaceDetector.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate },
        runningMode: "IMAGE",
        minDetectionConfidence: 0.45,
      });
    try {
      return (await make("GPU")) as unknown as Detector;
    } catch {
      return (await make("CPU")) as unknown as Detector;
    }
  } catch (err) {
    console.warn("Face detector unavailable", err);
    return null;
  }
}

export type VisualResult = { faces: FaceSample[]; cuts: number[]; detector: boolean };

export async function analyzeVisuals(
  file: Blob,
  duration: number,
  onProgress: (p: number) => void,
  signal: AbortSignal,
): Promise<VisualResult> {
  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const track = await input.getPrimaryVideoTrack();
  if (!track || !(await track.canDecode())) return { faces: [], cuts: [], detector: false };
  const detector = await createDetector();
  const fps = Math.max(0.25, Math.min(2, 360 / Math.max(1, duration)));
  const times: number[] = [];
  for (let t = 0.2; t < duration; t += 1 / fps) times.push(t);
  const W = 320;
  const sink = new CanvasSink(track, { width: W, poolSize: 2 });
  const work = document.createElement("canvas");
  const wctx = work.getContext("2d", { willReadFrequently: true })!;
  const faces: FaceSample[] = [];
  const cuts: number[] = [];
  let prev: Uint8ClampedArray | null = null;
  const thumb = document.createElement("canvas");
  thumb.width = 32;
  thumb.height = 18;
  const tctx = thumb.getContext("2d", { willReadFrequently: true })!;
  let i = 0;
  for await (const wc of sink.canvasesAtTimestamps(times)) {
    if (signal.aborted) break;
    const t = times[i++];
    if (!wc) continue;
    const c = wc.canvas as HTMLCanvasElement;
    if (work.width !== c.width || work.height !== c.height) {
      work.width = c.width;
      work.height = c.height;
    }
    wctx.drawImage(c, 0, 0);
    // scene cut: mean absolute luma difference on a 32x18 thumbnail
    tctx.drawImage(work, 0, 0, 32, 18);
    const px = tctx.getImageData(0, 0, 32, 18).data;
    if (prev) {
      let d = 0;
      for (let k = 0; k < px.length; k += 4) {
        const l1 = px[k] * 0.3 + px[k + 1] * 0.59 + px[k + 2] * 0.11;
        const l0 = prev[k] * 0.3 + prev[k + 1] * 0.59 + prev[k + 2] * 0.11;
        d += Math.abs(l1 - l0);
      }
      if (d / (32 * 18) > 38) cuts.push(t);
    }
    prev = new Uint8ClampedArray(px);
    if (detector) {
      try {
        const res = detector.detect(work);
        const best = res.detections
          .filter((d) => d.boundingBox)
          .map((d) => ({ b: d.boundingBox!, s: d.categories[0]?.score ?? 0 }))
          .sort((a, b) => b.b.width * b.b.height * b.s - a.b.width * a.b.height * a.s)[0];
        if (best) {
          faces.push({
            t,
            x: best.b.originX / work.width,
            y: best.b.originY / work.height,
            w: best.b.width / work.width,
            h: best.b.height / work.height,
            s: best.s,
          });
        } else faces.push({ t, none: true });
      } catch {
        faces.push({ t, none: true });
      }
    }
    if (i % 4 === 0) onProgress(i / times.length);
  }
  detector?.close();
  onProgress(1);
  return { faces, cuts, detector: !!detector };
}

/** Grab small poster frames (as JPEG data URLs) for clip cards. */
export async function posters(file: Blob, times: number[], width = 360): Promise<(string | null)[]> {
  const out: (string | null)[] = times.map(() => null);
  try {
    const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
    const track = await input.getPrimaryVideoTrack();
    if (!track || !(await track.canDecode())) return out;
    const sink = new CanvasSink(track, { width, poolSize: 1 });
    let i = 0;
    for await (const wc of sink.canvasesAtTimestamps(times)) {
      const idx = i++;
      if (!wc) continue;
      const c = wc.canvas;
      if ("toDataURL" in c) out[idx] = c.toDataURL("image/jpeg", 0.7);
    }
  } catch {
    /* posters are optional */
  }
  return out;
}

"use client";
/**
 * Clip export entry point. Rendering and encoding run in a Web Worker
 * (export.worker.ts) so the UI never freezes; if this browser's workers cannot
 * render (no OffscreenCanvas, worker fonts or WebCodecs), the same renderer runs
 * on the main thread instead.
 */
import type { Clip, FaceSample, Word } from "@/lib/types";
import { ExportCanceled, renderClip, type RenderJob } from "./render";
import type { ExportWorkerIn, ExportWorkerOut } from "./export.worker";

export { ExportCanceled };

export type ExportJob = {
  file: Blob;
  clip: Clip;
  words: Word[];
  faces: FaceSample[];
  logo?: HTMLImageElement | null;
  accent: string;
  /** end card URL text, or null for none */
  endCard: string | null;
  onProgress?: (p: number) => void;
  signal?: AbortSignal;
};

export async function exportClip(job: ExportJob): Promise<Blob> {
  const logo = job.logo ? await createImageBitmap(job.logo).catch(() => null) : null;
  const render: RenderJob = {
    file: job.file,
    clip: job.clip,
    words: job.words,
    faces: job.faces,
    logo,
    accent: job.accent,
    endCard: job.endCard,
  };
  const onProgress = job.onProgress ?? (() => undefined);
  if (typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined") {
    try {
      const res = await inWorker(render, onProgress, job.signal);
      if (res !== "unsupported") {
        console.info("hookcut export: rendered in a Web Worker");
        return res;
      }
    } catch (err) {
      if (err instanceof ExportCanceled || job.signal?.aborted) throw err;
      // a browser-specific gap inside the worker should not cost the user the export
      console.warn("Export worker failed, retrying on the main thread", err);
      onProgress(0);
    }
  }
  console.info("hookcut export: rendered on the main thread");
  return renderClip(render, onProgress, job.signal);
}

function inWorker(job: RenderJob, onProgress: (p: number) => void, signal?: AbortSignal): Promise<Blob | "unsupported"> {
  return new Promise((resolve, reject) => {
    let worker: Worker;
    try {
      worker = new Worker(new URL("./export.worker.ts", import.meta.url), { type: "module" });
    } catch {
      resolve("unsupported");
      return;
    }
    let started = false;
    const finish = () => {
      worker.terminate();
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => {
      finish();
      reject(new ExportCanceled("Export canceled"));
    };
    signal?.addEventListener("abort", onAbort);
    worker.onerror = (e) => {
      finish();
      // a worker that never ran (script failed to load) means: use the main thread
      if (!started) resolve("unsupported");
      else reject(new Error(e.message || "The export worker crashed."));
    };
    worker.onmessage = (e: MessageEvent<ExportWorkerOut>) => {
      const m = e.data;
      if (m.type === "progress") {
        started = true;
        onProgress(m.value);
      } else if (m.type === "done") {
        finish();
        resolve(m.blob);
      } else if (m.type === "unsupported") {
        finish();
        console.info(`Export worker unavailable (${m.missing}); exporting on the main thread`);
        resolve("unsupported");
      } else if (m.type === "error") {
        finish();
        reject(new Error(m.message));
      }
    };
    const msg: ExportWorkerIn = { type: "start", job };
    // the logo bitmap is copied, not transferred, so the main-thread fallback can reuse it
    worker.postMessage(msg);
  });
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

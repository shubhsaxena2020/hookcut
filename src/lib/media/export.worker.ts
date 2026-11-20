/// <reference lib="webworker" />
/**
 * Export worker: renders and encodes one clip off the main thread, so the studio
 * stays responsive while a clip exports. Posts "unsupported" when this browser's
 * workers lack what rendering needs, so the page can fall back to the main thread.
 */
import { ExportCanceled, renderClip, type RenderJob } from "./render";

export type ExportWorkerIn = { type: "start"; job: RenderJob };
export type ExportWorkerOut =
  | { type: "progress"; value: number }
  | { type: "done"; blob: Blob }
  | { type: "unsupported"; missing: string }
  | { type: "error"; message: string };

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const post = (m: ExportWorkerOut) => ctx.postMessage(m);

function missingFeature() {
  if (typeof OffscreenCanvas === "undefined") return "OffscreenCanvas";
  if (typeof VideoEncoder === "undefined") return "VideoEncoder";
  if (typeof FontFace === "undefined" || !("fonts" in ctx)) return "worker fonts";
  try {
    if (!new OffscreenCanvas(2, 2).getContext("2d")) return "OffscreenCanvas 2D";
  } catch {
    return "OffscreenCanvas 2D";
  }
  return null;
}

ctx.onmessage = async (ev: MessageEvent<ExportWorkerIn>) => {
  if (ev.data.type !== "start") return;
  const missing = missingFeature();
  if (missing) {
    post({ type: "unsupported", missing });
    return;
  }
  try {
    const blob = await renderClip(ev.data.job, (value) => post({ type: "progress", value }));
    post({ type: "done", blob });
  } catch (err) {
    if (err instanceof ExportCanceled) return;
    post({ type: "error", message: err instanceof Error ? err.message : String(err) });
  }
};

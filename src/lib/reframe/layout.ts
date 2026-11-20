import type { FaceSample, LayoutSettings, Rect } from "@/lib/types";

export type CamPath = { t0: number; step: number; x: Float32Array; y: Float32Array };

/** A smoothed, dead-zoned camera path that follows the main face. */
export function cameraPath(faces: FaceSample[], start: number, end: number): CamPath {
  const step = 0.1;
  const t0 = start - 0.5;
  const n = Math.max(2, Math.ceil((end + 0.5 - t0) / step));
  const pts = faces.filter((f) => f.t >= t0 - 3 && f.t <= end + 3);
  const raw = new Float32Array(n);
  const rawY = new Float32Array(n);
  let lastX = 0.5;
  let lastY = 0.4;
  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = t0 + i * step;
    while (j + 1 < pts.length && pts[j + 1].t <= t) j++;
    const a = pts[j];
    const b = pts[j + 1];
    const usable = (f?: FaceSample): f is Extract<FaceSample, { x: number }> => !!f && !("none" in f);
    if (usable(a) && usable(b) && b.t > a.t && t >= a.t) {
      const k = (t - a.t) / (b.t - a.t);
      lastX = a.x + a.w / 2 + (b.x + b.w / 2 - (a.x + a.w / 2)) * k;
      lastY = a.y + a.h / 2 + (b.y + b.h / 2 - (a.y + a.h / 2)) * k;
    } else if (usable(a) && Math.abs(t - a.t) < 1.5) {
      lastX = a.x + a.w / 2;
      lastY = a.y + a.h / 2;
    }
    raw[i] = lastX;
    rawY[i] = lastY;
  }
  const smooth = (src: Float32Array) => {
    const sigma = 6; // 0.6 s
    const out = new Float32Array(src.length);
    for (let i = 0; i < src.length; i++) {
      let s = 0;
      let w = 0;
      for (let k = -18; k <= 18; k++) {
        const idx = Math.min(src.length - 1, Math.max(0, i + k));
        const g = Math.exp(-(k * k) / (2 * sigma * sigma));
        s += src[idx] * g;
        w += g;
      }
      out[i] = s / w;
    }
    return out;
  };
  const sx = smooth(raw);
  const sy = smooth(rawY);
  // dead zone: the camera only moves when the face drifts away from where it is aimed
  const dz = 0.05;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  let cx = sx[0];
  let cy = sy[0];
  for (let i = 0; i < n; i++) {
    const dx = sx[i] - cx;
    if (Math.abs(dx) > dz) cx += (dx - Math.sign(dx) * dz) * 0.25;
    const dy = sy[i] - cy;
    if (Math.abs(dy) > dz) cy += (dy - Math.sign(dy) * dz) * 0.25;
    x[i] = cx;
    y[i] = cy;
  }
  return { t0, step, x, y };
}

export function camAt(p: CamPath | null, t: number) {
  if (!p) return { x: 0.5, y: 0.45 };
  const f = (t - p.t0) / p.step;
  const i = Math.max(0, Math.min(p.x.length - 2, Math.floor(f)));
  const k = Math.max(0, Math.min(1, f - i));
  return { x: p.x[i] + (p.x[i + 1] - p.x[i]) * k, y: p.y[i] + (p.y[i + 1] - p.y[i]) * k };
}

type Src = CanvasImageSource;
type Ctx = CanvasRenderingContext2D;

/** Crop rect in source pixels for a cover fit of aspect `ar` centred on (cx, cy). */
function coverCrop(sw: number, sh: number, ar: number, cx: number, cy: number, region?: Rect) {
  const rx = region ? region.x * sw : 0;
  const ry = region ? region.y * sh : 0;
  const rw = region ? region.w * sw : sw;
  const rh = region ? region.h * sh : sh;
  let w = rw;
  let h = rw / ar;
  if (h > rh) {
    h = rh;
    w = rh * ar;
  }
  const x = Math.max(rx, Math.min(rx + rw - w, rx + cx * rw - w / 2));
  const y = Math.max(ry, Math.min(ry + rh - h, ry + cy * rh - h / 2));
  return { x, y, w, h };
}

let tiny: HTMLCanvasElement | OffscreenCanvas | null = null;
function tinyCanvas(w: number, h: number) {
  if (!tiny) tiny = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : document.createElement("canvas");
  if (tiny.width !== w || tiny.height !== h) {
    tiny.width = w;
    tiny.height = h;
  }
  return tiny;
}

export function drawFrame(
  ctx: Ctx,
  src: Src,
  sw: number,
  sh: number,
  W: number,
  H: number,
  layout: LayoutSettings,
  cam: { x: number; y: number },
): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!sw || !sh) return;
  const mode = layout.mode;
  if (mode === "center" || mode === "auto") {
    const c = mode === "auto" ? cam : { x: 0.5, y: 0.5 };
    // vertical: keep heads in the upper third when we have to crop vertically
    const r = coverCrop(sw, sh, W / H, c.x, mode === "auto" ? Math.min(0.6, c.y + 0.1) : 0.5);
    ctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, W, H);
    return;
  }
  if (mode === "fit-blur") {
    const tw = Math.max(8, Math.round(W / 24));
    const th = Math.max(8, Math.round(H / 24));
    const t = tinyCanvas(tw, th);
    const tctx = t.getContext("2d") as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
    const r = coverCrop(sw, sh, W / H, 0.5, 0.5);
    tctx.drawImage(src, r.x, r.y, r.w, r.h, 0, 0, tw, th);
    ctx.drawImage(t, 0, 0, tw, th, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1);
    ctx.fillStyle = "rgba(8,9,30,0.35)";
    ctx.fillRect(0, 0, W, H);
    const s = Math.min(W / sw, H / sh);
    const dw = sw * s;
    const dh = sh * s;
    ctx.drawImage(src, 0, 0, sw, sh, (W - dw) / 2, (H - dh) / 2, dw, dh);
    return;
  }
  // stacked: facecam on top, gameplay below
  const topH = Math.round(H * layout.split);
  const fc = coverCrop(sw, sh, W / topH, 0.5, 0.5, layout.facecam);
  ctx.drawImage(src, fc.x, fc.y, fc.w, fc.h, 0, 0, W, topH);
  const gp = coverCrop(sw, sh, W / (H - topH), 0.5, 0.5);
  ctx.drawImage(src, gp.x, gp.y, gp.w, gp.h, 0, topH, W, H - topH);
  ctx.fillStyle = "#11133a";
  ctx.fillRect(0, topH - 3, W, 6);
}

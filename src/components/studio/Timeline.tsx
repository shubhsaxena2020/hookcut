"use client";

import { useEffect, useRef, useState } from "react";
import type { Word } from "@/lib/types";
import { wordsIn } from "@/lib/clips/score";
import { fmtTime } from "./ui";

type Props = {
  duration: number;
  energy: Float32Array;
  words: Word[];
  start: number;
  end: number;
  current: number;
  onSeek: (t: number) => void;
  onTrim: (start: number, end: number) => void;
};

function viewFor(start: number, end: number, duration: number) {
  const pad = Math.max(4, (end - start) * 0.35);
  return { a: Math.max(0, start - pad), b: Math.min(duration, end + pad) };
}

export function Timeline({ duration, energy, words, start, end, current, onSeek, onTrim }: Props) {
  const [view, setView] = useState(() => viewFor(start, end, duration));
  const [drag, setDrag] = useState<null | "in" | "out">(null);
  const wrap = useRef<HTMLDivElement>(null);
  const wave = useRef<HTMLCanvasElement>(null);

  // widen the view when a trim pushes past its edges (only once dragging stops)
  if (!drag && ((start < view.a + 0.5 && view.a > 0) || (end > view.b - 0.5 && view.b < duration)))
    setView(viewFor(start, end, duration));

  useEffect(() => {
    const c = wave.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth * dpr;
    const h = c.clientHeight * dpr;
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, w, h);
    if (!energy.length) return;
    let max = 1e-4;
    const i0 = Math.floor(view.a * 10);
    const i1 = Math.min(energy.length, Math.ceil(view.b * 10));
    for (let i = i0; i < i1; i++) max = Math.max(max, energy[i]);
    const bars = Math.floor(w / (3 * dpr));
    ctx.fillStyle = "#6e74b8";
    for (let k = 0; k < bars; k++) {
      const t = view.a + ((view.b - view.a) * k) / bars;
      const v = energy[Math.floor(t * 10)] ?? 0;
      const bh = Math.max(dpr, (v / max) * h * 0.9);
      ctx.fillRect(k * 3 * dpr, (h - bh) / 2, 2 * dpr, bh);
    }
  }, [energy, view]);

  const span = Math.max(0.1, view.b - view.a);
  const pct = (t: number) => ((t - view.a) / span) * 100;
  const tAt = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    return view.a + ((clientX - r.left) / r.width) * span;
  };
  const visible = wordsIn(words, view.a, view.b);

  const snap = (t: number, kind: "in" | "out") => {
    let best = t;
    let d = 0.35;
    for (const w of visible) {
      const edge = kind === "in" ? w.start - 0.1 : w.end + 0.1;
      if (Math.abs(edge - t) < d) {
        d = Math.abs(edge - t);
        best = edge;
      }
    }
    return Math.max(0, Math.min(duration, best));
  };

  const move = (clientX: number) => {
    if (!drag) return;
    const t = tAt(clientX);
    if (drag === "in") onTrim(Math.min(snap(t, "in"), end - 3), end);
    else onTrim(start, Math.max(snap(t, "out"), start + 3));
  };

  const handleKey = (kind: "in" | "out") => (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 1 : 0.1;
    let d = 0;
    if (e.key === "ArrowLeft") d = -step;
    else if (e.key === "ArrowRight") d = step;
    else return;
    e.preventDefault();
    e.stopPropagation();
    if (kind === "in") onTrim(Math.max(0, Math.min(end - 3, start + d)), end);
    else onTrim(start, Math.min(duration, Math.max(start + 3, end + d)));
  };

  return (
    <div className="select-none">
      <div className="mb-1 flex justify-between text-xs tabular-nums text-night-muted">
        <span>{fmtTime(view.a)}</span>
        <span>
          In {fmtTime(start)}, out {fmtTime(end)}, {(end - start).toFixed(1)}s
        </span>
        <span>{fmtTime(view.b)}</span>
      </div>
      <div
        ref={wrap}
        className="relative h-28 cursor-pointer overflow-hidden rounded-xl bg-night-1"
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).dataset.handle) return;
          onSeek(Math.max(start, Math.min(end, tAt(e.clientX))));
        }}
        onPointerMove={(e) => move(e.clientX)}
        onPointerUp={() => setDrag(null)}
        onPointerCancel={() => setDrag(null)}
      >
        <canvas ref={wave} className="absolute inset-x-0 top-0 h-16 w-full" aria-hidden="true" />
        {/* word track */}
        <div className="absolute inset-x-0 bottom-1 h-9" aria-hidden="true">
          {visible.map((w) => (
            <span
              key={w.id}
              className="absolute top-0 h-full overflow-hidden whitespace-nowrap rounded border-l border-night-line bg-night-2/80 px-0.5 text-[10px] leading-9 text-night-muted"
              style={{ left: `${pct(w.start)}%`, width: `${Math.max(0.3, pct(w.end) - pct(w.start))}%` }}
            >
              {w.text}
            </span>
          ))}
        </div>
        {/* outside the clip */}
        <div className="pointer-events-none absolute inset-y-0 left-0 bg-night/70" style={{ width: `${Math.max(0, pct(start))}%` }} />
        <div className="pointer-events-none absolute inset-y-0 right-0 bg-night/70" style={{ width: `${Math.max(0, 100 - pct(end))}%` }} />
        <div
          className="pointer-events-none absolute inset-y-0 border-y-2 border-mark/70"
          style={{ left: `${pct(start)}%`, width: `${pct(end) - pct(start)}%` }}
        />
        {/* playhead */}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-hot" style={{ left: `${pct(current)}%` }} />
        {(["in", "out"] as const).map((k) => (
          <button
            key={k}
            type="button"
            data-handle={k}
            role="slider"
            aria-label={k === "in" ? "Clip start" : "Clip end"}
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(k === "in" ? start : end)}
            aria-valuetext={fmtTime(k === "in" ? start : end)}
            onKeyDown={handleKey(k)}
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId);
              setDrag(k);
            }}
            className="absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize rounded bg-mark focus-visible:outline-white"
            style={{ left: `${pct(k === "in" ? start : end)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

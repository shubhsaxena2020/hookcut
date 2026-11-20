"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Clip, Project, SignalKey } from "@/lib/types";
import type { EndCard } from "@/lib/store/endcard";
import { ASPECTS, loadCaptionFonts } from "@/lib/captions/presets";
import { buildLines, drawCaptions, drawHook, drawLogo, drawProgress, toSrt, toVtt } from "@/lib/captions/render";
import { buildContext, scoreWindow, SIGNAL_LABELS } from "@/lib/clips/score";
import { keptSegments, outDuration, srcToOut, srcToOutClamped } from "@/lib/clips/segments";
import { cameraPath, camAt, drawFrame } from "@/lib/reframe/layout";
import { downloadBlob, safeName } from "@/lib/media/export";
import { Timeline } from "./Timeline";
import { CaptionsPanel, ClipPanel, LayoutPanel, WordsPanel } from "./EditorPanels";
import { Bar, Btn, ScoreBadge, fmtTime } from "./ui";

type Tab = "captions" | "words" | "layout" | "clip";

export function ClipEditor({
  project,
  clip,
  videoUrl,
  onChange,
  onFacecamAll,
  onBack,
  onExport,
  exportProgress,
  onCancelExport,
  accent,
  logo,
  endCard,
  endCardUrl,
  onEndCard,
}: {
  endCard: EndCard;
  endCardUrl: string;
  onEndCard: (e: EndCard) => void;
  project: Project;
  clip: Clip;
  videoUrl: string;
  onChange: (c: Clip) => void;
  onFacecamAll: (r: Clip["layout"]["facecam"]) => void;
  onBack: () => void;
  onExport: () => void;
  exportProgress?: number;
  onCancelExport: () => void;
  accent: string;
  logo: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tab, setTab] = useState<Tab>("captions");
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(clip.start);
  const [fontsOk, setFontsOk] = useState(false);
  const logoImg = useRef<HTMLImageElement | null>(null);

  const lines = useMemo(() => buildLines(project.words, clip), [project.words, clip]);
  const segs = useMemo(() => keptSegments(project.words, clip), [project.words, clip]);
  const total = outDuration(segs);
  const cam = useMemo(
    () => (clip.layout.mode === "auto" ? cameraPath(project.faces, clip.start, clip.end) : null),
    [project.faces, clip.start, clip.end, clip.layout.mode],
  );
  const scoreCtx = useMemo(
    () => buildContext(project.words, project.energy, project.faces, project.cuts, project.duration),
    [project.words, project.energy, project.faces, project.cuts, project.duration],
  );

  const live = useRef({ clip, lines, segs, total, cam, accent });
  useEffect(() => {
    live.current = { clip, lines, segs, total, cam, accent };
  }, [clip, lines, segs, total, cam, accent]);

  useEffect(() => {
    loadCaptionFonts().then(() => setFontsOk(true)).catch(() => setFontsOk(true));
  }, []);
  useEffect(() => {
    if (!logo) {
      logoImg.current = null;
      return;
    }
    const img = new Image();
    img.src = logo;
    img.decode().then(() => (logoImg.current = img)).catch(() => undefined);
  }, [logo]);

  const { w: OW, h: OH } = ASPECTS[clip.layout.aspect];
  const PW = 540;
  const PH = Math.round((OH / OW) * PW);

  // render loop
  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const loop = (ts: number) => {
      raf = requestAnimationFrame(loop);
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;
      const L = live.current;
      let t = v.currentTime;
      if (!v.paused) {
        if (t >= L.clip.end - 0.03) {
          v.pause();
          v.currentTime = L.clip.start;
          t = L.clip.start;
        } else if (srcToOut(L.segs, t) === null) {
          const next = L.segs.find((s) => s.a > t);
          if (next) v.currentTime = next.a;
          else {
            v.pause();
            v.currentTime = L.clip.start;
          }
        }
      }
      if (v.readyState >= 2) {
        const ctx = c.getContext("2d")!;
        const W = c.width;
        const H = c.height;
        drawFrame(ctx, v, v.videoWidth, v.videoHeight, W, H, L.clip.layout, camAt(L.cam, t));
        drawCaptions(ctx, W, H, L.lines, t, L.clip.captions);
        const ot = srcToOutClamped(L.segs, t);
        if (L.clip.showHook) drawHook(ctx, W, H, L.clip.hook || L.clip.title, ot);
        if (L.clip.showProgress) drawProgress(ctx, W, H, ot / Math.max(0.1, L.total), L.accent);
        if (logoImg.current) drawLogo(ctx, W, H, logoImg.current);
      }
      if (ts - lastUi > 120) {
        lastUi = ts;
        setNow(t);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fontsOk]);

  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = t;
  }, []);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      if (v.currentTime < clip.start || v.currentTime >= clip.end - 0.05) v.currentTime = clip.start;
      v.playbackRate = 1;
      void v.play();
    } else v.pause();
  }, [clip.start, clip.end]);

  const trim = useCallback(
    (start: number, end: number) => {
      const s = scoreWindow(scoreCtx, start, end);
      onChange({ ...clip, start, end, score: s.score, signals: s.signals, reasons: s.reasons.length ? s.reasons : clip.reasons });
    },
    [clip, onChange, scoreCtx],
  );

  // keyboard shortcuts: space/K play-pause, J back, L forward, I/O set in/out, arrows step
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const v = videoRef.current;
      if (!v) return;
      const k = e.key.toLowerCase();
      if (k === " " || k === "k") {
        e.preventDefault();
        if (k === "k") v.pause();
        else toggle();
      } else if (k === "j") {
        v.currentTime = Math.max(clip.start, v.currentTime - 2);
      } else if (k === "l") {
        if (v.paused) toggle();
        else v.playbackRate = Math.min(2, v.playbackRate + 0.5);
      } else if (k === "i") {
        trim(Math.min(v.currentTime, clip.end - 3), clip.end);
      } else if (k === "o") {
        trim(clip.start, Math.max(v.currentTime, clip.start + 3));
      } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        if (el && el.getAttribute("role") === "slider") return;
        e.preventDefault();
        const step = e.shiftKey ? 1 : 1 / 30;
        v.currentTime = Math.max(0, v.currentTime + (e.key === "ArrowLeft" ? -step : step));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clip.start, clip.end, toggle, trim]);

  const mapOut = (t: number) => srcToOutClamped(segs, t);
  const downloadCaptions = (kind: "srt" | "vtt") => {
    const text = kind === "srt" ? toSrt(lines, mapOut) : toVtt(lines, mapOut);
    downloadBlob(new Blob([text], { type: kind === "srt" ? "application/x-subrip" : "text/vtt" }), `${safeName(clip.title)}.${kind}`);
  };

  const outNow = srcToOutClamped(segs, now);
  const exporting = exportProgress !== undefined;

  return (
    <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_420px]" data-testid="editor">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Btn variant="quiet" onClick={onBack}>
            Back to clips
          </Btn>
          <h1 className="min-w-0 flex-1 truncate font-semibold" title={clip.title}>
            {clip.title}
          </h1>
          {exporting ? (
            <div className="flex items-center gap-2">
              <span className="text-sm tabular-nums text-night-muted" data-testid="export-progress">
                Exporting {Math.round((exportProgress ?? 0) * 100)}%
              </span>
              <Btn variant="danger" onClick={onCancelExport}>
                Cancel
              </Btn>
            </div>
          ) : (
            <Btn variant="primary" onClick={onExport} data-testid="export-clip">
              Export MP4
            </Btn>
          )}
        </div>
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-night-1 p-4 md:flex-row md:items-start">
          <div className="relative w-full max-w-[340px] shrink-0">
            <canvas
              ref={canvasRef}
              width={PW}
              height={PH}
              className="block w-full rounded-xl bg-black"
              style={{ aspectRatio: `${OW} / ${OH}` }}
              aria-label="Clip preview"
              data-testid="preview-canvas"
              onClick={toggle}
            />
            <video
              ref={videoRef}
              src={videoUrl}
              className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
              aria-hidden="true"
              tabIndex={-1}
              playsInline
              preload="auto"
              onLoadedMetadata={(e) => (e.currentTarget.currentTime = clip.start)}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
            />
          </div>
          <div className="w-full min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Btn variant="primary" onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="w-24">
                {playing ? "Pause" : "Play"}
              </Btn>
              <span className="tabular-nums text-sm text-night-muted">
                {fmtTime(outNow)} / {fmtTime(total)}
              </span>
            </div>
            <div className="mt-4 flex items-start gap-3">
              <ScoreBadge score={clip.score} large />
              <div className="min-w-0">
                <h2 className="font-semibold">Why this clip</h2>
                <ul className="mt-1 space-y-0.5 text-sm text-night-muted">
                  {clip.ai && <li>AI: {clip.ai.reason}</li>}
                  {clip.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4 space-y-1.5" aria-label="Score breakdown">
              {(Object.keys(SIGNAL_LABELS) as SignalKey[]).map((k) => (
                <Bar key={k} label={SIGNAL_LABELS[k]} value={clip.signals[k]} />
              ))}
            </div>
            <p className="mt-4 text-xs text-night-muted">
              Shortcuts: Space play or pause, J back 2s, K pause, L play faster, I set start, O set end, arrows step a frame.
            </p>
          </div>
        </div>
        <div className="mt-4">
          <Timeline
            duration={project.duration}
            energy={project.energy}
            words={project.words}
            start={clip.start}
            end={clip.end}
            current={now}
            onSeek={seek}
            onTrim={trim}
          />
        </div>
      </div>

      <aside className="min-w-0 rounded-2xl border border-night-line bg-night-1">
        <div role="tablist" aria-label="Editor panels" className="flex border-b border-night-line">
          {(
            [
              ["captions", "Captions"],
              ["words", "Words"],
              ["layout", "Layout"],
              ["clip", "Clip"],
            ] as [Tab, string][]
          ).map(([k, l]) => (
            <button
              key={k}
              id={`tab-${k}`}
              type="button"
              role="tab"
              aria-selected={tab === k}
              aria-controls={`panel-${k}`}
              onClick={() => setTab(k)}
              className={`flex-1 px-3 py-3 text-sm font-semibold ${tab === k ? "border-b-2 border-mark text-white" : "text-night-muted hover:text-white"}`}
            >
              {l}
            </button>
          ))}
        </div>
        <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="max-h-[calc(100dvh-10rem)] overflow-y-auto p-4">
          {tab === "captions" && <CaptionsPanel clip={clip} onChange={onChange} />}
          {tab === "words" && <WordsPanel clip={clip} words={project.words} onChange={onChange} onSeek={seek} />}
          {tab === "layout" && (
            <LayoutPanel clip={clip} onChange={onChange} onFacecamAll={onFacecamAll} videoRef={videoRef} />
          )}
          {tab === "clip" && (
            <ClipPanel
              clip={clip}
              onChange={onChange}
              onCaptions={downloadCaptions}
              endCard={endCard}
              endCardUrl={endCardUrl}
              onEndCard={onEndCard}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

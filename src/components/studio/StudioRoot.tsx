"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ALL_FORMATS, BlobSource, Input } from "mediabunny";
import { Logo } from "@/components/brand/Logo";
import type { AsrEvent } from "@/lib/asr/protocol";
import { detectCaps, type Caps } from "@/lib/caps";
import { buildContext, findClips, wordsIn, type NewClipDefaults } from "@/lib/clips/score";
import { defaultLayout, loadCaptionFonts, presetSettings } from "@/lib/captions/presets";
import { analyzeVisuals, posters as makePosters } from "@/lib/media/analyze";
import { downloadBlob, exportClip, ExportCanceled, safeName } from "@/lib/media/export";
import { deleteProject, listProjects, loadProject, saveProject } from "@/lib/store/db";
import { DEFAULT_BRAND, loadBrand, saveBrand, type BrandKit } from "@/lib/store/brand";
import type { Clip, ModelSize, Project, ProjectMeta } from "@/lib/types";
import { DropZone } from "./DropZone";
import { ProcessingPanel, type PipelineStatus } from "./ProcessingPanel";
import { ClipsGrid } from "./ClipsGrid";
import { ClipEditor } from "./ClipEditor";
import { BrandKitDialog } from "./BrandKitDialog";
import { Btn } from "./ui";

export type StudioSettings = { model: ModelSize; lang: string; target: 15 | 30 | 60 | 90 };

const IDLE: PipelineStatus = {
  stage: "idle",
  progress: 0,
  detail: "",
  device: null,
  visual: 0,
  startedAt: 0,
  transcribeStartedAt: 0,
  running: false,
};

function defaultsFrom(brand: BrandKit): NewClipDefaults {
  const captions = presetSettings(brand.preset);
  if (brand.font) captions.font = brand.font;
  if (brand.highlight) captions.highlight = brand.highlight;
  return {
    captions,
    layout: defaultLayout(),
    removeFillers: false,
    removeSilences: false,
    showHook: true,
    showProgress: false,
    fps: 30,
  };
}

export function StudioRoot() {
  const [caps, setCaps] = useState<Caps | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [recent, setRecent] = useState<ProjectMeta[]>([]);
  const [status, setStatus] = useState<PipelineStatus>(IDLE);
  const [selected, setSelected] = useState<string | null>(null);
  const [posterMap, setPosterMap] = useState<Record<string, string>>({});
  const [exports, setExports] = useState<Record<string, number>>({});
  const [brand, setBrand] = useState<BrandKit>(() => (typeof window === "undefined" ? DEFAULT_BRAND : loadBrand()));
  const [brandOpen, setBrandOpen] = useState(false);
  const [settings, setSettings] = useState<StudioSettings>({ model: "base", lang: "auto", target: 30 });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [aiOn, setAiOn] = useState(false);
  const [aiState, setAiState] = useState<"idle" | "running" | "done" | "unavailable">("idle");

  const brandRef = useRef(brand);
  const projectRef = useRef(project);
  useEffect(() => {
    brandRef.current = brand;
    projectRef.current = project;
  }, [brand, project]);
  const workerRef = useRef<Worker | null>(null);
  const visualAbort = useRef<AbortController | null>(null);
  const exportAborts = useRef<Record<string, AbortController>>({});

  useEffect(() => {
    detectCaps().then(setCaps);
    listProjects().then(setRecent);
    loadCaptionFonts().catch(() => undefined);
  }, []);

  const videoUrl = useMemo(() => (project ? URL.createObjectURL(project.file) : null), [project?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  // persist (debounced) whenever the project changes
  useEffect(() => {
    if (!project) return;
    const t = setTimeout(() => {
      saveProject({ ...project, updatedAt: Date.now(), clipCount: project.clips.length })
        .then(() => listProjects().then(setRecent))
        .catch(() => setNotice("Could not save this project in the browser. Storage may be full or blocked."));
    }, 900);
    return () => clearTimeout(t);
  }, [project]);

  const rescore = useCallback((p: Project, upTo = Infinity): Project => {
    if (!p.words.length) return p;
    const ctx = buildContext(p.words, p.energy, p.faces, p.cuts, p.duration);
    const keep = p.clips.filter((c) => c.touched);
    const clips = findClips(ctx, p.targetLength, defaultsFrom(brandRef.current), keep, upTo);
    return { ...p, clips };
  }, []);

  const stopPipeline = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    visualAbort.current?.abort();
    visualAbort.current = null;
    setStatus((s) => ({ ...s, running: false, stage: s.stage === "done" ? "done" : "canceled" }));
  }, []);

  const runPipeline = useCallback(
    (p: Project) => {
      stopPipeline();
      const now = performance.now();
      setStatus({ ...IDLE, stage: "decode", running: true, startedAt: now });
      const worker = new Worker(new URL("../../lib/asr/worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onerror = (e) => {
        setError(`Transcription failed: ${e.message || "the worker crashed"}.`);
        setStatus((s) => ({ ...s, running: false, stage: "error" }));
      };
      worker.onmessage = (e: MessageEvent<AsrEvent>) => {
        const ev = e.data;
        if (ev.type === "stage") {
          setStatus((s) => ({
            ...s,
            stage: ev.stage,
            progress: ev.progress,
            detail: ev.detail ?? "",
            transcribeStartedAt: ev.stage === "transcribe" && !s.transcribeStartedAt ? performance.now() : s.transcribeStartedAt,
          }));
        } else if (ev.type === "device") {
          setStatus((s) => ({ ...s, device: ev.device }));
        } else if (ev.type === "audio") {
          setProject((q) => (q && q.id === p.id ? { ...q, energy: ev.energy, duration: ev.duration || q.duration } : q));
        } else if (ev.type === "words") {
          setProject((q) => {
            if (!q || q.id !== p.id) return q;
            return rescore({ ...q, words: [...q.words, ...ev.words] }, ev.upTo);
          });
        } else if (ev.type === "done") {
          worker.terminate();
          workerRef.current = null;
          setStatus((s) => ({ ...s, stage: "done", progress: 1, running: false }));
          setProject((q) => (q && q.id === p.id ? rescore({ ...q, transcribed: true }) : q));
        } else if (ev.type === "error") {
          worker.terminate();
          workerRef.current = null;
          setError(ev.message);
          setStatus((s) => ({ ...s, running: false, stage: "error" }));
        }
      };
      worker.postMessage({ type: "start", file: p.file, model: p.model, lang: p.lang });

      const ac = new AbortController();
      visualAbort.current = ac;
      analyzeVisuals(p.file, p.duration, (v) => setStatus((s) => ({ ...s, visual: v })), ac.signal)
        .then((res) => {
          if (ac.signal.aborted) return;
          setProject((q) => (q && q.id === p.id ? rescore({ ...q, faces: res.faces, cuts: res.cuts }, q.transcribed ? Infinity : lastUpTo(q)) : q));
          setAiState((st) => (st === "done" ? "idle" : st));
        })
        .catch((err) => console.warn("visual analysis failed", err));
    },
    [rescore, stopPipeline],
  );

  const openFile = useCallback(
    async (file: File) => {
      setError(null);
      setNotice(null);
      try {
        const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
        const vt = await input.getPrimaryVideoTrack();
        if (!vt) throw new Error("No video track was found in this file.");
        if (!(await vt.canDecode()))
          throw new Error(`Your browser cannot decode this video codec (${vt.codec ?? "unknown"}). Try an H.264 MP4.`);
        const duration = await input.computeDuration();
        if (duration > 3 * 3600) setNotice("This video is over three hours long. Processing may run out of memory.");
        const p: Project = {
          id: crypto.randomUUID(),
          name: file.name.replace(/\.[^.]+$/, "") || "Untitled video",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          duration,
          width: vt.displayWidth,
          height: vt.displayHeight,
          clipCount: 0,
          file,
          fileType: file.type,
          words: [],
          energy: new Float32Array(0),
          faces: [],
          cuts: [],
          clips: [],
          transcribed: false,
          lang: settings.lang,
          model: settings.model,
          targetLength: settings.target,
        };
        setPosterMap({});
        setSelected(null);
        setAiState("idle");
        setProject(p);
        runPipeline(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "This file could not be opened.");
      }
    },
    [runPipeline, settings],
  );

  const resume = useCallback(
    async (id: string) => {
      setError(null);
      const p = await loadProject(id);
      if (!p) {
        setError("That project could not be loaded from browser storage.");
        return;
      }
      setPosterMap({});
      setSelected(null);
      setAiState("idle");
      if (!p.transcribed) {
        const fresh = { ...p, words: [], clips: p.clips.filter((c) => c.touched) };
        setProject(fresh);
        runPipeline(fresh);
      } else {
        setStatus({ ...IDLE, stage: "done", progress: 1, visual: 1 });
        setProject(p);
      }
    },
    [runPipeline],
  );

  const closeProject = useCallback(() => {
    stopPipeline();
    for (const ac of Object.values(exportAborts.current)) ac.abort();
    setProject(null);
    setSelected(null);
    setStatus(IDLE);
    listProjects().then(setRecent);
  }, [stopPipeline]);

  // posters for clip cards (after transcription so we do not compete for the decoder)
  useEffect(() => {
    if (!project || !project.transcribed) return;
    const missing = project.clips.filter((c) => !posterMap[posterKey(c)]);
    if (!missing.length) return;
    let alive = true;
    makePosters(project.file, missing.map((c) => Math.min(project.duration - 0.1, c.start + 1.5))).then((urls) => {
      if (!alive) return;
      setPosterMap((m) => {
        const n = { ...m };
        missing.forEach((c, i) => {
          if (urls[i]) n[posterKey(c)] = urls[i]!;
        });
        return n;
      });
    });
    return () => {
      alive = false;
    };
  }, [project?.clips, project?.transcribed]); // eslint-disable-line react-hooks/exhaustive-deps

  // optional AI re-rank, sends transcript text only
  useEffect(() => {
    if (!aiOn || aiState !== "idle" || !project?.transcribed || !project.clips.length) return;
    const p = project;
    const timer = setTimeout(() => {
    setAiState("running");
    const candidates = p.clips.slice(0, 20).map((c) => ({
      id: c.id,
      text: wordsIn(p.words, c.start, c.end)
        .map((w) => w.text)
        .join(" ")
        .slice(0, 2400),
    }));
    fetch("/api/rank", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ candidates }),
    })
      .then((r) => r.json())
      .then((res: { ok: boolean; clips?: { id: string; title: string; hook: string; score: number; reason: string }[] }) => {
        if (!res.ok || !res.clips) {
          setAiState("unavailable");
          return;
        }
        const byId = new Map(res.clips.map((c) => [c.id, c]));
        setProject((q) => {
          if (!q || q.id !== p.id) return q;
          const clips = q.clips
            .map((c) => {
              const a = byId.get(c.id);
              if (!a) return c;
              const blended = Math.round(0.6 * c.score + 0.4 * Math.max(0, Math.min(100, a.score)));
              return {
                ...c,
                ai: { score: Math.round(a.score), reason: a.reason },
                score: blended,
                title: c.touched ? c.title : a.title.slice(0, 80),
                hook: c.touched ? c.hook : a.hook.slice(0, 80),
              };
            })
            .sort((x, y) => y.score - x.score);
          return { ...q, clips };
        });
        setAiState("done");
      })
      .catch(() => setAiState("unavailable"));
    }, 0);
    return () => clearTimeout(timer);
  }, [aiOn, aiState, project]);

  const updateClip = useCallback((clip: Clip) => {
    setProject((q) => (q ? { ...q, clips: q.clips.map((c) => (c.id === clip.id ? { ...clip, touched: true } : c)) } : q));
  }, []);

  const setFacecamAll = useCallback((rect: Clip["layout"]["facecam"]) => {
    setProject((q) => (q ? { ...q, clips: q.clips.map((c) => ({ ...c, layout: { ...c.layout, facecam: rect } })) } : q));
  }, []);

  const changeTarget = useCallback(
    (target: StudioSettings["target"]) => {
      setSettings((s) => ({ ...s, target }));
      setAiState((st) => (st === "done" ? "idle" : st));
      setProject((q) => (q ? rescore({ ...q, targetLength: target }, q.transcribed ? Infinity : lastUpTo(q)) : q));
    },
    [rescore],
  );

  const logoImg = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!brand.logo) {
      logoImg.current = null;
      return;
    }
    const img = new Image();
    img.src = brand.logo;
    img.decode().then(() => (logoImg.current = img)).catch(() => (logoImg.current = null));
  }, [brand.logo]);

  const exportOne = useCallback(async (clip: Clip) => {
    const p = projectRef.current;
    if (!p) return;
    const ac = new AbortController();
    exportAborts.current[clip.id] = ac;
    setExports((e) => ({ ...e, [clip.id]: 0 }));
    try {
      const blob = await exportClip({
        file: p.file,
        clip,
        words: p.words,
        faces: p.faces,
        srcWidth: p.width,
        srcHeight: p.height,
        logo: logoImg.current,
        accent: brandRef.current.accent,
        signal: ac.signal,
        onProgress: (v) => setExports((e) => ({ ...e, [clip.id]: v })),
      });
      downloadBlob(blob, `${safeName(clip.title)}-hookcut.mp4`);
      setNotice(`Exported "${clip.title}" (${(blob.size / 1e6).toFixed(1)} MB).`);
    } catch (err) {
      if (!(err instanceof ExportCanceled) && !ac.signal.aborted) {
        setError(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    } finally {
      delete exportAborts.current[clip.id];
      setExports((e) => {
        const n = { ...e };
        delete n[clip.id];
        return n;
      });
    }
  }, []);

  const exportAll = useCallback(async () => {
    const p = projectRef.current;
    if (!p) return;
    for (const c of p.clips) {
      if (!projectRef.current || projectRef.current.id !== p.id) break;
      const latest = projectRef.current.clips.find((x) => x.id === c.id) ?? c;
      await exportOne(latest);
    }
  }, [exportOne]);

  const cancelExport = useCallback((id: string) => exportAborts.current[id]?.abort(), []);

  const selectedClip = project?.clips.find((c) => c.id === selected) ?? null;

  // keyboard: Escape closes the editor
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected && !(e.target instanceof HTMLInputElement)) setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const unsupported = caps && (!caps.webcodecs || !caps.indexeddb);

  return (
    <div className="studio flex min-h-dvh flex-col bg-night text-night-text">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-night-line bg-night/95 px-4 backdrop-blur">
        <Link href="/" aria-label="Hookcut home" className="shrink-0">
          <Logo tone="dark" size={24} />
        </Link>
        {project && (
          <span className="hidden min-w-0 truncate text-sm text-night-muted sm:block" title={project.name}>
            / {project.name}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {caps && (
            <span className="hidden text-xs text-night-muted md:inline" data-testid="caps">
              {caps.webgpu ? "WebGPU on" : "WebGPU off, using WebAssembly"}
              {caps.h264 === false ? ", no H.264 encoder" : ""}
            </span>
          )}
          <Btn variant="quiet" onClick={() => setBrandOpen(true)}>
            Brand kit
          </Btn>
          {project && (
            <Btn variant="ghost" onClick={closeProject}>
              New video
            </Btn>
          )}
        </div>
      </header>

      {(error || notice) && (
        <div className="mx-auto mt-3 w-full max-w-6xl px-4" role="status" aria-live="polite">
          {error && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-hot/40 bg-hot/10 px-4 py-3 text-sm" role="alert" data-testid="studio-error">
              <span>{error}</span>
              <button type="button" className="text-night-muted hover:text-white" onClick={() => setError(null)} aria-label="Dismiss error">
                Close
              </button>
            </div>
          )}
          {notice && !error && (
            <div className="flex items-start justify-between gap-4 rounded-xl border border-night-line bg-night-1 px-4 py-3 text-sm">
              <span>{notice}</span>
              <button type="button" className="text-night-muted hover:text-white" onClick={() => setNotice(null)} aria-label="Dismiss message">
                Close
              </button>
            </div>
          )}
        </div>
      )}

      <main id="main" className="flex-1">
        {unsupported ? (
          <div className="mx-auto max-w-xl px-4 py-24 text-center">
            <h1 className="font-display text-3xl font-black">This browser cannot run the studio</h1>
            <p className="mt-4 text-night-muted">
              Hookcut needs WebCodecs and IndexedDB to decode and encode video on your device. Open this page in a recent
              Chrome, Edge or Safari 17+ on a laptop or desktop.
            </p>
          </div>
        ) : !project ? (
          <DropZone
            onFile={openFile}
            recent={recent}
            onResume={resume}
            onDelete={async (id) => {
              await deleteProject(id);
              setRecent(await listProjects());
            }}
            settings={settings}
            onSettings={setSettings}
            onError={setError}
          />
        ) : selectedClip && videoUrl ? (
          <ClipEditor
            key={selectedClip.id}
            project={project}
            clip={selectedClip}
            videoUrl={videoUrl}
            onChange={updateClip}
            onFacecamAll={setFacecamAll}
            onBack={() => setSelected(null)}
            onExport={() => exportOne(selectedClip)}
            exportProgress={exports[selectedClip.id]}
            onCancelExport={() => cancelExport(selectedClip.id)}
            accent={brand.accent}
            logo={brand.logo}
          />
        ) : (
          <div className="mx-auto w-full max-w-6xl px-4 py-6">
            <ProcessingPanel
              status={status}
              project={project}
              onCancel={stopPipeline}
              onRestart={() => {
                const fresh = { ...project, words: [], clips: [], transcribed: false };
                setProject(fresh);
                runPipeline(fresh);
              }}
            />
            <ClipsGrid
              project={project}
              posters={posterMap}
              posterKey={posterKey}
              running={status.running}
              exports={exports}
              onOpen={setSelected}
              onExport={exportOne}
              onCancelExport={cancelExport}
              onExportAll={exportAll}
              target={project.targetLength}
              onTarget={changeTarget}
              aiOn={aiOn}
              aiState={aiState}
              onAi={(v) => {
                setAiOn(v);
                if (v) setAiState("idle");
              }}
            />
          </div>
        )}
      </main>

      {brandOpen && (
        <BrandKitDialog
          brand={brand}
          onClose={() => setBrandOpen(false)}
          onSave={(b, applyAll) => {
            setBrand(b);
            saveBrand(b);
            setBrandOpen(false);
            if (applyAll) {
              setProject((q) => {
                if (!q) return q;
                const d = defaultsFrom(b);
                return { ...q, clips: q.clips.map((c) => ({ ...c, captions: { ...d.captions } })) };
              });
            }
          }}
        />
      )}
    </div>
  );
}

function posterKey(c: Clip) {
  return `${Math.round(c.start * 2)}`;
}

function lastUpTo(p: Project) {
  const w = p.words[p.words.length - 1];
  return w ? w.end + 0.5 : 0;
}

"use client";

import { useEffect, useState } from "react";
import type { Project } from "@/lib/types";
import { Btn, fmtTime } from "./ui";

export type PipelineStatus = {
  stage: "idle" | "decode" | "model" | "transcribe" | "done" | "error" | "canceled";
  progress: number;
  detail: string;
  device: "webgpu" | "wasm" | null;
  visual: number;
  startedAt: number;
  transcribeStartedAt: number;
  running: boolean;
};

/** "Detected language: Spanish." for auto-detect projects, once known. */
function langLine(p: Project) {
  if (p.lang !== "auto" || p.detectedLang === undefined) return "";
  if (p.detectedLang === null) return "Could not detect the language, so English was used.";
  let name = p.detectedLang;
  try {
    name = new Intl.DisplayNames(["en"], { type: "language" }).of(p.detectedLang) ?? name;
  } catch {
    /* unknown code: show it as is */
  }
  return `Detected language: ${name}. Not right? Choose the spoken language before you drop the video.`;
}

const STEPS: { key: PipelineStatus["stage"]; label: string }[] = [
  { key: "decode", label: "Read audio" },
  { key: "model", label: "Load speech model" },
  { key: "transcribe", label: "Transcribe and score" },
];

export function ProcessingPanel({
  status,
  project,
  onCancel,
  onRestart,
}: {
  status: PipelineStatus;
  project: Project;
  onCancel: () => void;
  onRestart: () => void;
}) {
  const [nowMs, setNowMs] = useState(0);
  useEffect(() => {
    if (!status.running) return;
    const i = setInterval(() => setNowMs(performance.now()), 1000);
    return () => clearInterval(i);
  }, [status.running]);

  const lang = langLine(project);

  if (status.stage === "done" && project.transcribed) {
    return (
      <p className="mb-4 text-sm text-night-muted" data-testid="processing-done">
        Transcribed {project.words.length.toLocaleString()} words from {fmtTime(project.duration)} of video
        {status.device ? ` using ${status.device === "webgpu" ? "WebGPU" : "WebAssembly"}` : ""}.
        {lang && <span data-testid="detected-lang"> {lang}</span>}
      </p>
    );
  }

  const idx = STEPS.findIndex((s) => s.key === status.stage);
  let eta = "";
  if (status.stage === "transcribe" && status.progress > 0.04 && status.transcribeStartedAt && nowMs > status.transcribeStartedAt) {
    const elapsed = (nowMs - status.transcribeStartedAt) / 1000;
    const left = (elapsed / status.progress) * (1 - status.progress);
    eta = `about ${left < 60 ? `${Math.max(5, Math.round(left / 5) * 5)} seconds` : `${Math.round(left / 60)} min`} left`;
  }

  return (
    <section className="mb-6 rounded-2xl border border-night-line bg-night-1 p-5" aria-labelledby="proc-title" aria-busy={status.running}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="proc-title" className="font-semibold">
          {status.stage === "error"
            ? "Processing stopped"
            : status.stage === "canceled"
              ? "Processing canceled"
              : "Finding your best moments"}
        </h2>
        {status.running ? (
          <Btn variant="danger" onClick={onCancel}>
            Cancel
          </Btn>
        ) : (
          <Btn onClick={onRestart}>Start again</Btn>
        )}
      </div>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, i) => {
          const state = i < idx || status.stage === "done" ? "done" : i === idx ? "active" : "todo";
          const pct = state === "done" ? 1 : state === "active" ? status.progress : 0;
          return (
            <li key={s.key} className="rounded-xl bg-night-2 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className={state === "todo" ? "text-night-muted" : ""}>
                  {i + 1}. {s.label}
                </span>
                <span className="tabular-nums text-xs text-night-muted">
                  {state === "done" ? "Done" : state === "active" ? `${Math.round(pct * 100)}%` : ""}
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-night-line"
                role="progressbar"
                aria-label={s.label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(pct * 100)}
              >
                <div className="h-full rounded-full bg-mark transition-[width]" style={{ width: `${pct * 100}%` }} />
              </div>
              {state === "active" && (status.detail || eta) && (
                <p className="mt-1.5 text-xs text-night-muted">{status.detail || eta}</p>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-xs text-night-muted">
        Face tracking {Math.round(status.visual * 100)}%
        {status.device && `, speech on ${status.device === "webgpu" ? "WebGPU" : "WebAssembly (slower; WebGPU is unavailable)"}`}
        {project.words.length > 0 && `, ${project.words.length.toLocaleString()} words so far`}. Clips appear below as they are found.
        {lang && <span data-testid="detected-lang"> {lang}</span>}
      </p>
    </section>
  );
}

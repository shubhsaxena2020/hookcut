"use client";

import type { Clip, Project, SignalKey } from "@/lib/types";
import { SIGNAL_LABELS } from "@/lib/clips/score";
import { Bar, Btn, ScoreBadge, Toggle, fmtTime } from "./ui";

export function ClipsGrid({
  project,
  posters,
  posterKey,
  running,
  exports,
  onOpen,
  onExport,
  onCancelExport,
  onExportAll,
  target,
  onTarget,
  aiOn,
  aiState,
  onAi,
}: {
  project: Project;
  posters: Record<string, string>;
  posterKey: (c: Clip) => string;
  running: boolean;
  exports: Record<string, number>;
  onOpen: (id: string) => void;
  onExport: (c: Clip) => void;
  onCancelExport: (id: string) => void;
  onExportAll: () => void;
  target: number;
  onTarget: (t: 15 | 30 | 60 | 90) => void;
  aiOn: boolean;
  aiState: "idle" | "running" | "done" | "unavailable";
  onAi: (v: boolean) => void;
}) {
  const clips = project.clips;
  const busy = Object.keys(exports).length > 0;
  return (
    <section aria-labelledby="clips-title">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="clips-title" className="font-display text-2xl font-black tracking-tight">
            {clips.length ? `${clips.length} clips found` : running ? "Listening for clips..." : "No clips yet"}
          </h2>
          <p className="text-sm text-night-muted">Sorted by score. Open a clip to edit captions, layout and timing.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div role="radiogroup" aria-label="Clip length" className="flex rounded-full bg-night-1 p-1">
            {([15, 30, 60, 90] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={target === t}
                onClick={() => onTarget(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${target === t ? "bg-mark text-ink" : "text-night-muted hover:text-white"}`}
              >
                {t}s
              </button>
            ))}
          </div>
          <Btn variant="primary" onClick={onExportAll} disabled={!clips.length || busy || running} data-testid="export-all">
            Export all
          </Btn>
        </div>
      </div>

      <div className="mt-4 max-w-xl rounded-xl border border-night-line bg-night-1 px-4 py-2">
        <Toggle
          id="ai-toggle"
          checked={aiOn}
          onChange={onAi}
          label="AI titles and re-ranking"
          hint={
            aiState === "running"
              ? "Asking the model..."
              : aiState === "done"
                ? "Done. Scores now blend the heuristic and AI ratings."
                : aiState === "unavailable"
                  ? "AI ranking is unavailable right now, so the on-device score is used."
                  : "Sends the transcript text of each clip (never audio or video) to rank and title it."
          }
        />
      </div>

      {clips.length === 0 && !running && (
        <p className="mt-10 rounded-2xl border border-night-line bg-night-1 p-6 text-night-muted">
          No speech-based clips were found. Try a shorter clip length, or a video with more talking.
        </p>
      )}

      <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="clips-grid">
        {clips.map((c, i) => {
          const poster = posters[posterKey(c)];
          const top = (Object.entries(c.signals) as [SignalKey, number][]).sort((a, b) => b[1] - a[1]).slice(0, 3);
          const ex = exports[c.id];
          return (
            <li key={c.id} className="flex flex-col overflow-hidden rounded-2xl border border-night-line bg-night-1" data-testid="clip-card">
              <button
                type="button"
                onClick={() => onOpen(c.id)}
                className="group relative block aspect-video w-full overflow-hidden bg-night-2 text-left"
                aria-label={`Edit clip ${i + 1}: ${c.title}`}
              >
                {poster ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={poster} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]" />
                ) : (
                  <span className="absolute inset-0 animate-pulse bg-night-2" />
                )}
                <span className="absolute left-3 top-3" data-testid="clip-score">
                  <ScoreBadge score={c.score} />
                </span>
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs tabular-nums">
                  {fmtTime(c.start)} · {Math.round(c.end - c.start)}s
                </span>
              </button>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="line-clamp-2 font-semibold leading-snug">{c.title}</h3>
                <ul className="mt-2 space-y-0.5 text-xs text-night-muted">
                  {(c.ai ? [c.ai.reason, ...c.reasons] : c.reasons).slice(0, 2).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <div className="mt-3 space-y-1.5">
                  {top.map(([k, v]) => (
                    <Bar key={k} label={SIGNAL_LABELS[k]} value={v} />
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-2 pt-4">
                  <Btn variant="primary" onClick={() => onOpen(c.id)} className="flex-1">
                    Edit
                  </Btn>
                  {ex !== undefined ? (
                    <Btn variant="danger" onClick={() => onCancelExport(c.id)} aria-label="Cancel export">
                      {Math.round(ex * 100)}%
                    </Btn>
                  ) : (
                    <Btn onClick={() => onExport(c)} disabled={busy} data-testid="quick-export">
                      Export
                    </Btn>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

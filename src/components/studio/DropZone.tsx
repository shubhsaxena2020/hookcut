"use client";

import { useRef, useState } from "react";
import type { ProjectMeta } from "@/lib/types";
import type { StudioSettings } from "./StudioRoot";
import { Btn, Field, fmtTime, inputCls } from "./ui";

const LANGS: [string, string][] = [
  ["auto", "Detect automatically"],
  ["en", "English (faster, English-only model)"],
  ["es", "Spanish"],
  ["fr", "French"],
  ["de", "German"],
  ["it", "Italian"],
  ["pt", "Portuguese"],
  ["nl", "Dutch"],
  ["hi", "Hindi"],
  ["ja", "Japanese"],
  ["ko", "Korean"],
  ["zh", "Chinese"],
  ["ru", "Russian"],
  ["ar", "Arabic"],
  ["tr", "Turkish"],
  ["pl", "Polish"],
  ["uk", "Ukrainian"],
  ["id", "Indonesian"],
  ["vi", "Vietnamese"],
  ["th", "Thai"],
  ["sv", "Swedish"],
  ["bn", "Bengali"],
  ["ur", "Urdu"],
];

const YT = /(youtube\.com|youtu\.be)\//i;

export function DropZone({
  onFile,
  recent,
  onResume,
  onDelete,
  settings,
  onSettings,
  onError,
}: {
  onFile: (f: File) => void;
  recent: ProjectMeta[];
  onResume: (id: string) => void;
  onDelete: (id: string) => void;
  settings: StudioSettings;
  onSettings: (s: StudioSettings) => void;
  onError: (msg: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);

  const openUrl = async () => {
    const u = url.trim();
    if (!u) return;
    if (YT.test(u)) {
      onError(
        "Browsers cannot download YouTube videos, so Hookcut cannot open YouTube links. If it is your video, download it from YouTube Studio and drop the file here.",
      );
      return;
    }
    setFetching(true);
    try {
      const res = await fetch(u, { mode: "cors" });
      if (!res.ok) throw new Error(`The server answered ${res.status}.`);
      const blob = await res.blob();
      const name = decodeURIComponent(new URL(u).pathname.split("/").pop() || "video.mp4");
      onFile(new File([blob], name, { type: blob.type || "video/mp4" }));
    } catch (err) {
      onError(
        `That link could not be opened. It must be a direct video file on a server that allows cross-origin downloads (CORS). ${err instanceof Error ? err.message : ""}`,
      );
    } finally {
      setFetching(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.5fr_1fr]">
      <section aria-labelledby="drop-title">
        <h1 id="drop-title" className="font-display text-3xl font-black tracking-tight sm:text-4xl">
          Drop a long video. Get the Shorts.
        </h1>
        <p className="mt-2 text-night-muted">
          Nothing is uploaded. Your video is processed on this device.
        </p>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files[0];
            if (f) onFile(f);
          }}
          className={`mt-6 flex min-h-72 flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${over ? "border-mark bg-night-2" : "border-night-line bg-night-1"}`}
        >
          <svg viewBox="0 0 48 48" className="h-12 w-12" aria-hidden="true">
            <rect x="8" y="4" width="32" height="40" rx="8" fill="none" stroke="#ffe14a" strokeWidth="3" />
            <path d="M24 30V16m0 0l-6 6m6-6l6 6" stroke="#ffe14a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="mt-4 text-lg font-semibold">Drag a video file here</p>
          <p className="mt-1 text-sm text-night-muted">MP4, MOV, WebM or MKV, up to about 2 hours</p>
          <Btn variant="primary" className="mt-5 px-6 py-2.5" onClick={() => inputRef.current?.click()}>
            Choose a video
          </Btn>
          <input
            ref={inputRef}
            type="file"
            accept="video/*,.mkv,.mov"
            className="sr-only"
            data-testid="file-input"
            aria-label="Choose a video file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="url" className="sr-only">
            Direct video URL
          </label>
          <input
            id="url"
            className={inputCls}
            placeholder="Or paste a direct video link (https://.../video.mp4)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && openUrl()}
          />
          <Btn onClick={openUrl} disabled={fetching || !url.trim()}>
            {fetching ? "Downloading..." : "Open link"}
          </Btn>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-2xl border border-night-line bg-night-1 p-5" aria-labelledby="settings-title">
          <h2 id="settings-title" className="font-semibold">
            Before you start
          </h2>
          <div className="mt-4 space-y-4">
            <Field label="Clip length" htmlFor="target">
              <div id="target" role="radiogroup" aria-label="Clip length" className="grid grid-cols-4 gap-1.5">
                {([15, 30, 60, 90] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={settings.target === t}
                    onClick={() => onSettings({ ...settings, target: t })}
                    className={`rounded-lg py-2 text-sm font-semibold ${settings.target === t ? "bg-mark text-ink" : "bg-night-2 text-night-text hover:bg-night-line"}`}
                  >
                    {t}s
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Spoken language" htmlFor="lang">
              <select
                id="lang"
                className={inputCls}
                value={settings.lang}
                onChange={(e) => onSettings({ ...settings, lang: e.target.value })}
              >
                {LANGS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Transcription quality" htmlFor="model">
              <select
                id="model"
                className={inputCls}
                value={settings.model}
                onChange={(e) => onSettings({ ...settings, model: e.target.value as StudioSettings["model"] })}
              >
                <option value="tiny">Fast (tiny model, about 40 MB)</option>
                <option value="base">Balanced (base model, about 80 MB)</option>
                <option value="small">Accurate (small model, about 250 MB)</option>
              </select>
            </Field>
            <p className="text-xs text-night-muted">
              The speech model downloads once and is cached by your browser.
            </p>
          </div>
        </section>

        {recent.length > 0 && (
          <section aria-labelledby="recent-title">
            <h2 id="recent-title" className="font-semibold">
              Recent projects
            </h2>
            <ul className="mt-3 space-y-2">
              {recent.map((r) => (
                <li key={r.id} className="flex items-center gap-3 rounded-xl border border-night-line bg-night-1 px-4 py-3">
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onResume(r.id)}>
                    <span className="block truncate font-medium">{r.name}</span>
                    <span className="text-xs text-night-muted">
                      {fmtTime(r.duration)} source, {r.clipCount} clips
                    </span>
                  </button>
                  <button
                    type="button"
                    className="text-xs text-night-muted hover:text-hot"
                    onClick={() => onDelete(r.id)}
                    aria-label={`Delete project ${r.name}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}

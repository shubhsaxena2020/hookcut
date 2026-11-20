"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { CaptionSettings, Clip, LayoutMode, Rect, Word, WordEdit } from "@/lib/types";
import type { EndCard } from "@/lib/store/endcard";
import { FONT_OPTIONS, PRESETS, PRESET_ORDER, presetSettings } from "@/lib/captions/presets";
import { buildLines, isFiller } from "@/lib/captions/render";
import { wordsIn } from "@/lib/clips/score";
import { Btn, Field, Toggle, inputCls } from "./ui";

/* ---------------- Captions ---------------- */
export function CaptionsPanel({ clip, onChange }: { clip: Clip; onChange: (c: Clip) => void }) {
  const s = clip.captions;
  const set = (patch: Partial<CaptionSettings>) => onChange({ ...clip, captions: { ...s, ...patch } });
  return (
    <div className="space-y-5">
      <Field label="Style">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Caption style">
          {PRESET_ORDER.map((p) => {
            const ps = PRESETS[p];
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={s.preset === p}
                data-testid={`preset-${p}`}
                onClick={() => onChange({ ...clip, captions: { ...presetSettings(p), profanityFilter: s.profanityFilter } })}
                className={`rounded-xl border p-3 text-left ${s.preset === p ? "border-mark bg-night-2" : "border-night-line hover:border-night-muted"}`}
              >
                <span
                  className="block truncate text-base"
                  style={{
                    fontFamily: `"HC ${ps.settings.font}", sans-serif`,
                    color: ps.settings.highlight === "#ffffff" ? "#fff" : ps.settings.highlight,
                    textTransform: ps.settings.uppercase ? "uppercase" : "none",
                  }}
                >
                  {ps.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-tight text-night-muted">{ps.blurb}</span>
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Font" htmlFor="cap-font">
          <select id="cap-font" className={inputCls} value={s.font} onChange={(e) => set({ font: e.target.value as CaptionSettings["font"] })}>
            {FONT_OPTIONS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </Field>
        <Field label="Words per line" htmlFor="cap-wpl">
          <select
            id="cap-wpl"
            className={inputCls}
            value={s.wordsPerLine}
            onChange={(e) => set({ wordsPerLine: Number(e.target.value) as 1 | 2 | 3 })}
          >
            <option value={1}>1 word</option>
            <option value={2}>2 words</option>
            <option value={3}>3 words</option>
          </select>
        </Field>
      </div>
      <Slider id="cap-size" label="Size" min={0.025} max={0.1} step={0.001} value={s.size} onChange={(v) => set({ size: v })} />
      <Slider id="cap-y" label="Position (top to bottom)" min={0.1} max={0.92} step={0.01} value={s.y} onChange={(v) => set({ y: v })} />
      <Slider id="cap-stroke" label="Outline" min={0} max={0.3} step={0.01} value={s.stroke} onChange={(v) => set({ stroke: v })} />
      <div className="grid grid-cols-3 gap-3">
        <Color id="cap-color" label="Text" value={s.color} onChange={(v) => set({ color: v })} />
        <Color id="cap-hl" label="Spoken word" value={s.highlight} onChange={(v) => set({ highlight: v })} />
        <Color id="cap-kw" label="Keywords" value={s.keywordColor} onChange={(v) => set({ keywordColor: v })} />
      </div>
      <div className="divide-y divide-night-line">
        <Toggle id="t-upper" label="Uppercase" checked={s.uppercase} onChange={(v) => set({ uppercase: v })} />
        <Toggle id="t-shadow" label="Shadow" checked={s.shadow} onChange={(v) => set({ shadow: v })} />
        <Toggle id="t-kw" label="Colour keywords" hint="Numbers, strong words and rare terms" checked={s.emphasizeKeywords} onChange={(v) => set({ emphasizeKeywords: v })} />
        <Toggle id="t-emoji" label="Auto emoji" hint="Adds a matching emoji above some lines" checked={s.emoji} onChange={(v) => set({ emoji: v })} />
        <Toggle id="t-prof" label="Profanity filter" hint="Masks swear words in captions" checked={s.profanityFilter} onChange={(v) => set({ profanityFilter: v })} />
      </div>
    </div>
  );
}

function Slider({ id, label, min, max, step, value, onChange }: { id: string; label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <Field label={label} htmlFor={id}>
      <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </Field>
  );
}

function Color({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label} htmlFor={id}>
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-full cursor-pointer rounded-lg border border-night-line bg-night" />
    </Field>
  );
}

/* ---------------- Words ---------------- */
export function WordsPanel({
  clip,
  words,
  onChange,
  onSeek,
}: {
  clip: Clip;
  words: Word[];
  onChange: (c: Clip) => void;
  onSeek: (t: number) => void;
}) {
  const ws = useMemo(() => wordsIn(words, clip.start, clip.end), [words, clip.start, clip.end]);
  const lineStarts = useMemo(() => {
    const lines = buildLines(words, { ...clip, removeFillers: false, edits: Object.fromEntries(Object.entries(clip.edits).map(([k, e]) => [k, { ...e, cut: false }])) });
    return new Set(lines.map((l) => Math.floor(l.words[0].id)));
  }, [words, clip]);
  const [sel, setSel] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [find, setFind] = useState("");
  const [repl, setRepl] = useState("");
  const [msg, setMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (sel !== null) inputRef.current?.focus();
  }, [sel]);

  const edit = (id: number, patch: Partial<WordEdit> | null) => {
    const edits = { ...clip.edits };
    if (patch === null) delete edits[id];
    else edits[id] = { ...edits[id], ...patch };
    onChange({ ...clip, edits });
  };

  const selected = ws.find((w) => w.id === sel);
  const textOf = (w: Word) => clip.edits[w.id]?.text ?? w.text;

  const commit = () => {
    if (selected) {
      const t = draft.trim();
      if (t && t !== selected.text) edit(selected.id, { text: t });
      else if (t === selected.text) edit(selected.id, { text: undefined });
    }
  };

  const replaceAll = () => {
    const f = find.trim();
    if (!f) return;
    const re = new RegExp(`^${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([.,!?]*)$`, "i");
    const edits = { ...clip.edits };
    let n = 0;
    for (const w of ws) {
      const cur = textOf(w);
      const m = cur.match(re);
      if (m) {
        edits[w.id] = { ...edits[w.id], text: repl + (m[1] ?? "") };
        n++;
      }
    }
    onChange({ ...clip, edits });
    setMsg(n ? `Replaced ${n} ${n === 1 ? "word" : "words"}. Timing is unchanged.` : "No matching words in this clip.");
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-night-muted">
        Click a word to fix it. Each word keeps its own timing, so edits never drift out of sync.
      </p>

      {selected && (
        <div className="rounded-xl border border-mark/60 bg-night-2 p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              commit();
              setSel(null);
            }}
            className="flex gap-2"
          >
            <label htmlFor="word-input" className="sr-only">
              Edit word
            </label>
            <input
              id="word-input"
              ref={inputRef}
              data-testid="word-input"
              className={inputCls}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setSel(null)}
            />
            <Btn type="submit" variant="primary">
              Save
            </Btn>
          </form>
          <p className="mt-1.5 text-xs text-night-muted">
            Spoken at {selected.start.toFixed(2)}s. Type two words to split this one.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Btn className="px-3 py-1 text-xs" onClick={() => edit(selected.id, { brk: clip.edits[selected.id]?.brk === "split" ? undefined : "split" })}>
              {clip.edits[selected.id]?.brk === "split" ? "Remove line break" : "New line here"}
            </Btn>
            <Btn className="px-3 py-1 text-xs" onClick={() => edit(selected.id, { brk: clip.edits[selected.id]?.brk === "join" ? undefined : "join" })}>
              {clip.edits[selected.id]?.brk === "join" ? "Undo join" : "Join to previous line"}
            </Btn>
            <Btn className="px-3 py-1 text-xs" onClick={() => edit(selected.id, { cut: !clip.edits[selected.id]?.cut })}>
              {clip.edits[selected.id]?.cut ? "Show word" : "Hide word"}
            </Btn>
            <Btn variant="quiet" className="px-3 py-1 text-xs" onClick={() => edit(selected.id, null)}>
              Reset
            </Btn>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-1 rounded-xl bg-night p-3 leading-relaxed" data-testid="word-list">
        {ws.map((w) => {
          const e = clip.edits[w.id];
          const t = textOf(w);
          const brk = lineStarts.has(w.id) && w !== ws[0];
          return (
            <span key={w.id} className="contents">
              {brk && <span className="basis-full" aria-hidden="true" />}
              <button
                type="button"
                data-testid="word-chip"
                onClick={() => {
                  setSel(w.id);
                  setDraft(t);
                  onSeek(w.start);
                }}
                className={`rounded px-1.5 py-0.5 text-sm ${sel === w.id ? "bg-mark text-ink" : e?.text ? "bg-cobalt/60 text-white" : "hover:bg-night-2"} ${e?.cut ? "line-through opacity-50" : ""} ${isFiller(t) ? "italic text-night-muted" : ""}`}
                title={`${w.start.toFixed(2)}s to ${w.end.toFixed(2)}s`}
              >
                {t}
              </button>
            </span>
          );
        })}
      </div>

      <div className="rounded-xl border border-night-line p-3">
        <h3 className="text-sm font-semibold">Find and replace</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="sr-only" htmlFor="find">
            Find
          </label>
          <input id="find" className={inputCls} placeholder="Find" value={find} onChange={(e) => setFind(e.target.value)} />
          <label className="sr-only" htmlFor="repl">
            Replace with
          </label>
          <input id="repl" className={inputCls} placeholder="Replace with" value={repl} onChange={(e) => setRepl(e.target.value)} />
        </div>
        <div className="mt-2 flex items-center gap-3">
          <Btn onClick={replaceAll} disabled={!find.trim()}>
            Replace all
          </Btn>
          {msg && <span className="text-xs text-night-muted" role="status">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Layout ---------------- */
const MODES: [LayoutMode, string, string][] = [
  ["auto", "Auto face", "Follows the speaker"],
  ["center", "Center", "Fixed centre crop"],
  ["fit-blur", "Fit with blur", "Whole frame, blurred fill"],
  ["stacked", "Stacked facecam", "Webcam on top, gameplay below"],
];

export function LayoutPanel({
  clip,
  onChange,
  onFacecamAll,
  videoRef,
}: {
  clip: Clip;
  onChange: (c: Clip) => void;
  onFacecamAll: (r: Rect) => void;
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const l = clip.layout;
  const set = (patch: Partial<Clip["layout"]>) => onChange({ ...clip, layout: { ...l, ...patch } });
  return (
    <div className="space-y-5">
      <Field label="Layout">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Layout">
          {MODES.map(([m, label, hint]) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={l.mode === m}
              data-testid={`layout-${m}`}
              onClick={() => set({ mode: m })}
              className={`rounded-xl border p-3 text-left ${l.mode === m ? "border-mark bg-night-2" : "border-night-line hover:border-night-muted"}`}
            >
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block text-[11px] text-night-muted">{hint}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Shape">
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Aspect ratio">
          {(["9:16", "1:1", "4:5"] as const).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={l.aspect === a}
              onClick={() => set({ aspect: a })}
              className={`rounded-lg py-2 text-sm font-semibold ${l.aspect === a ? "bg-mark text-ink" : "bg-night-2 hover:bg-night-line"}`}
            >
              {a}
            </button>
          ))}
        </div>
      </Field>
      {l.mode === "stacked" && (
        <>
          <FacecamPicker key={JSON.stringify(l.facecam)} rect={l.facecam} videoRef={videoRef} onChange={(r) => onFacecamAll(r)} />
          <Field label="Facecam height" htmlFor="split">
            <input id="split" type="range" min={0.25} max={0.6} step={0.01} value={l.split} onChange={(e) => set({ split: Number(e.target.value) })} className="w-full" />
          </Field>
        </>
      )}
    </div>
  );
}

function FacecamPicker({ rect, videoRef, onChange }: { rect: Rect; videoRef: RefObject<HTMLVideoElement | null>; onChange: (r: Rect) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [r, setR] = useState(rect);
  const drag = useRef<null | { mode: "move" | "resize"; x: number; y: number; r: Rect }>(null);

  useEffect(() => {
    const v = videoRef.current;
    const c = canvas.current;
    if (!v || !c) return;
    const draw = () => {
      if (v.readyState < 2) return;
      c.width = 480;
      c.height = Math.round((v.videoHeight / Math.max(1, v.videoWidth)) * 480) || 270;
      c.getContext("2d")!.drawImage(v, 0, 0, c.width, c.height);
    };
    draw();
    const i = setInterval(draw, 500);
    return () => clearInterval(i);
  }, [videoRef]);

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    const b = box.current?.getBoundingClientRect();
    if (!d || !b) return;
    const dx = (e.clientX - d.x) / b.width;
    const dy = (e.clientY - d.y) / b.height;
    const n =
      d.mode === "move"
        ? { ...d.r, x: Math.max(0, Math.min(1 - d.r.w, d.r.x + dx)), y: Math.max(0, Math.min(1 - d.r.h, d.r.y + dy)) }
        : { ...d.r, w: Math.max(0.05, Math.min(1 - d.r.x, d.r.w + dx)), h: Math.max(0.05, Math.min(1 - d.r.y, d.r.h + dy)) };
    setR(n);
  };
  const end = () => {
    if (drag.current) onChange(r);
    drag.current = null;
  };

  return (
    <div>
      <p className="mb-2 text-xs text-night-muted">Drag the box over your webcam. It is reused for every clip in this project.</p>
      <div ref={box} className="relative overflow-hidden rounded-lg bg-black" onPointerMove={onMove} onPointerUp={end} onPointerCancel={end}>
        <canvas ref={canvas} className="block w-full" aria-hidden="true" />
        <div
          className="absolute cursor-move border-2 border-mark bg-mark/15"
          style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
          onPointerDown={(e) => {
            (e.currentTarget.parentElement as HTMLElement).setPointerCapture(e.pointerId);
            drag.current = { mode: "move", x: e.clientX, y: e.clientY, r };
          }}
          role="img"
          aria-label="Facecam area"
        >
          <span
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-nwse-resize rounded-sm bg-mark"
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget.parentElement!.parentElement as HTMLElement).setPointerCapture(e.pointerId);
              drag.current = { mode: "resize", x: e.clientX, y: e.clientY, r };
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------- Clip ---------------- */
export function ClipPanel({
  clip,
  onChange,
  onCaptions,
  endCard,
  endCardUrl,
  onEndCard,
}: {
  clip: Clip;
  onChange: (c: Clip) => void;
  onCaptions: (k: "srt" | "vtt") => void;
  endCard: EndCard;
  endCardUrl: string;
  onEndCard: (e: EndCard) => void;
}) {
  const [copied, setCopied] = useState("");
  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(`${label} copied`);
    } catch {
      setCopied("Copy is blocked in this browser");
    }
    setTimeout(() => setCopied(""), 2000);
  };
  return (
    <div className="space-y-5">
      <Field label="Title" htmlFor="clip-title">
        <input id="clip-title" className={inputCls} value={clip.title} onChange={(e) => onChange({ ...clip, title: e.target.value })} />
      </Field>
      <Field label="Hook text (first 3 seconds)" htmlFor="clip-hook">
        <input id="clip-hook" className={inputCls} value={clip.hook} onChange={(e) => onChange({ ...clip, hook: e.target.value })} />
      </Field>
      <Field label="Description" htmlFor="clip-desc">
        <textarea id="clip-desc" rows={3} className={inputCls} value={clip.description} onChange={(e) => onChange({ ...clip, description: e.target.value })} />
      </Field>
      <Field label="Hashtags" htmlFor="clip-tags">
        <input
          id="clip-tags"
          className={inputCls}
          value={clip.hashtags.join(" ")}
          onChange={(e) => onChange({ ...clip, hashtags: e.target.value.split(/\s+/).filter(Boolean) })}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <Btn className="px-3 py-1.5 text-xs" onClick={() => copy("Title", clip.title)}>
          Copy title
        </Btn>
        <Btn className="px-3 py-1.5 text-xs" onClick={() => copy("Description", `${clip.description}\n\n${clip.hashtags.join(" ")}`)}>
          Copy description
        </Btn>
        <Btn className="px-3 py-1.5 text-xs" onClick={() => copy("Hashtags", clip.hashtags.join(" "))}>
          Copy hashtags
        </Btn>
        {copied && (
          <span className="self-center text-xs text-night-muted" role="status">
            {copied}
          </span>
        )}
      </div>
      <div className="divide-y divide-night-line">
        <Toggle id="t-hook" label="Hook title overlay" hint="Shows the hook text for the first 3 seconds" checked={clip.showHook} onChange={(v) => onChange({ ...clip, showHook: v })} />
        <Toggle id="t-prog" label="Progress bar" checked={clip.showProgress} onChange={(v) => onChange({ ...clip, showProgress: v })} />
        <Toggle id="t-fill" label="Remove filler words" hint="Cuts um, uh and hidden words" checked={clip.removeFillers} onChange={(v) => onChange({ ...clip, removeFillers: v })} />
        <Toggle id="t-sil" label="Remove silences" hint="Cuts pauses longer than 0.6 seconds" checked={clip.removeSilences} onChange={(v) => onChange({ ...clip, removeSilences: v })} />
      </div>
      <Field label="Frame rate">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Frame rate">
          {([30, 60] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={clip.fps === f}
              onClick={() => onChange({ ...clip, fps: f })}
              className={`rounded-lg py-2 text-sm font-semibold ${clip.fps === f ? "bg-mark text-ink" : "bg-night-2 hover:bg-night-line"}`}
            >
              {f} fps
            </button>
          ))}
        </div>
      </Field>
      <section aria-labelledby="export-opts" className="rounded-xl border border-night-line p-3">
        <h3 id="export-opts" className="text-xs font-medium text-night-muted">
          Export options (all clips)
        </h3>
        <div className="mt-1 divide-y divide-night-line">
          <Toggle
            id="t-endcard"
            label="Made with Hookcut end card"
            hint="Help Hookcut stay free: adds a 1.5 second outro after your clip, never over it. Turn it off any time."
            checked={endCard.on}
            onChange={(v) => onEndCard({ ...endCard, on: v })}
          />
          {endCard.on && (
            <Toggle
              id="t-endref"
              label="Include my referral code"
              hint="A random code made in this browser, not linked to you. Stays on this device."
              checked={endCard.withRef}
              onChange={(v) => onEndCard({ ...endCard, withRef: v })}
            />
          )}
        </div>
        {endCard.on && (
          <p className="mt-2 text-xs text-night-muted" data-testid="endcard-url">
            The card shows: <span className="font-semibold text-night-text">{endCardUrl}</span>
          </p>
        )}
      </section>
      <div>
        <h3 className="text-xs font-medium text-night-muted">Caption files</h3>
        <div className="mt-1.5 flex gap-2">
          <Btn onClick={() => onCaptions("srt")} data-testid="download-srt">
            Download SRT
          </Btn>
          <Btn onClick={() => onCaptions("vtt")}>Download VTT</Btn>
        </div>
      </div>
    </div>
  );
}

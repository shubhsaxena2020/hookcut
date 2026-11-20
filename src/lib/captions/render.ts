import type { CaptionSettings, Clip, Word, WordEdit } from "@/lib/types";
import { EMOJI, FILLERS, PROFANITY, STOPWORDS, EMOTION } from "@/lib/clips/lexicon";
import { FONT_FILES } from "./presets";

export type RWord = { id: number; text: string; start: number; end: number; keyword: boolean; emoji?: string };
export type Line = { words: RWord[]; start: number; end: number; show: number; hide: number };

const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9'$]/g, "");

export function isFiller(text: string) {
  return FILLERS.has(clean(text));
}

function mask(text: string) {
  const c = clean(text);
  if (!PROFANITY.has(c)) return text;
  return text.replace(/[a-z]/gi, (ch, i: number) => (i === 0 ? ch : "*"));
}

/** Apply per-clip edits to the shared transcript. Timing always comes from the source words. */
export function editedWords(words: Word[], edits: Record<number, WordEdit>, opts: { dropFillers: boolean }) {
  const out: (Word & { brk?: "split" | "join" })[] = [];
  for (const w of words) {
    const e = edits[w.id];
    if (e?.cut) continue;
    const text = (e?.text ?? w.text).trim();
    if (!text) continue;
    if (opts.dropFillers && isFiller(text)) continue;
    const parts = text.split(/\s+/);
    if (parts.length === 1) {
      out.push({ ...w, text, brk: e?.brk });
      continue;
    }
    // a word split into several: divide its own span by character count
    const total = parts.reduce((s, p) => s + p.length, 0);
    let t = w.start;
    parts.forEach((p, i) => {
      const d = ((w.end - w.start) * p.length) / total;
      out.push({ id: w.id + i / 100, text: p, start: t, end: t + d, brk: i === 0 ? e?.brk : undefined });
      t += d;
    });
  }
  return out;
}

export function buildLines(words: Word[], clip: Clip): Line[] {
  const s = clip.captions;
  const list = editedWords(words, clip.edits, { dropFillers: clip.removeFillers });
  const lines: Line[] = [];
  let cur: RWord[] = [];
  const flush = () => {
    if (!cur.length) return;
    lines.push({ words: cur, start: cur[0].start, end: cur[cur.length - 1].end, show: 0, hide: 0 });
    cur = [];
  };
  for (let i = 0; i < list.length; i++) {
    const w = list[i];
    const prev = list[i - 1];
    if (cur.length) {
      const forced = w.brk === "split";
      const joined = w.brk === "join";
      const full = cur.length >= s.wordsPerLine;
      const gap = prev && w.start - prev.end > 0.7;
      const punct = prev && /[.?!]$/.test(prev.text);
      if (forced || (!joined && (full || gap || punct))) flush();
    }
    let text = s.profanityFilter ? mask(w.text) : w.text;
    if (s.uppercase) text = text.toUpperCase();
    const c = clean(w.text);
    const keyword =
      s.emphasizeKeywords &&
      ((c.length >= 6 && !STOPWORDS.has(c)) || /\d/.test(c) || (EMOTION[c] ?? 0) >= 0.8);
    const emoji = s.emoji ? EMOJI.find(([re]) => re.test(c))?.[1] : undefined;
    cur.push({ id: w.id, text, start: w.start, end: w.end, keyword, emoji });
  }
  flush();
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    const next = lines[i + 1];
    l.show = l.start - 0.05;
    l.hide = next ? Math.min(next.start - 0.02, l.end + 0.6) : l.end + 0.6;
  }
  return lines;
}

export function activeLine(lines: Line[], t: number) {
  // binary search would be nicer; clips have at most a few hundred lines
  for (const l of lines) if (t >= l.show && t < l.hide) return l;
  return null;
}

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function fontString(s: CaptionSettings, px: number) {
  const weight = FONT_FILES[s.font]?.weight ?? "700";
  return `${weight} ${px}px "HC ${s.font}", "${s.font}", system-ui, sans-serif`;
}

type Ctx = CanvasRenderingContext2D;

export function drawCaptions(ctx: Ctx, W: number, H: number, lines: Line[], t: number, s: CaptionSettings) {
  const line = activeLine(lines, t);
  if (!line) return;
  const base = Math.min(W * (16 / 9), H * 1.25);
  let px = s.size * base;
  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.lineJoin = "round";
  ctx.font = fontString(s, px);
  const space = () => ctx.measureText(" ").width;
  let widths = line.words.map((w) => ctx.measureText(w.text).width);
  let total = widths.reduce((a, b) => a + b, 0) + space() * (line.words.length - 1);
  const maxW = W * (s.preset === "lower-third" ? 0.92 : 0.86);
  if (total > maxW) {
    px *= maxW / total;
    ctx.font = fontString(s, px);
    widths = line.words.map((w) => ctx.measureText(w.text).width);
    total = widths.reduce((a, b) => a + b, 0) + space() * (line.words.length - 1);
  }
  const sp = space();
  const y = s.y * H;
  let x = (W - total) / 2;
  const padX = px * 0.22;
  const boxH = px * 1.3;

  if (s.preset === "lower-third") {
    ctx.fillStyle = "rgba(10,12,40,0.62)";
    ctx.fillRect(0, y - boxH * 0.75, W, boxH * 1.5);
  }
  if (s.preset === "boxed") {
    ctx.fillStyle = "rgba(17,19,58,0.9)";
    rr(ctx, x - padX * 1.6, y - boxH / 2 - px * 0.08, total + padX * 3.2, boxH + px * 0.16, px * 0.28);
    ctx.fill();
  }

  // emoji above the line
  const emoji = line.words.find((w) => w.emoji)?.emoji;
  if (emoji) {
    ctx.save();
    ctx.font = `${px * 1.1}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(emoji, W / 2, y - px * 1.25);
    ctx.restore();
  }

  line.words.forEach((w, i) => {
    const wW = widths[i];
    const active = t >= w.start && t < w.end + 0.04;
    const spoken = t >= w.start;
    let color = w.keyword ? s.keywordColor : s.color;
    let scale = 1;
    let rot = 0;
    let alpha = 1;
    switch (s.preset) {
      case "bold-pop":
        if (active) {
          color = s.highlight;
          scale = 1.12;
        }
        break;
      case "gaming":
        if (active) {
          color = s.highlight;
          scale = 1.15;
          rot = -0.06;
        }
        break;
      case "big-punch":
        if (active) color = s.highlight;
        scale = 1 + 0.22 * Math.max(0, 1 - (t - w.start) / 0.12);
        break;
      case "karaoke":
        color = spoken ? s.highlight : s.color;
        break;
      case "minimal":
      case "lower-third":
        alpha = spoken ? 1 : 0.72;
        break;
      case "neon":
        if (active) color = s.highlight;
        break;
      case "boxed":
        if (active) {
          ctx.fillStyle = s.highlight;
          rr(ctx, x - padX * 0.6, y - boxH / 2 + px * 0.04, wW + padX * 1.2, boxH - px * 0.08, px * 0.18);
          ctx.fill();
          color = "#11133a";
        }
        break;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + wW / 2, y);
    if (scale !== 1) ctx.scale(scale, scale);
    if (rot) ctx.rotate(rot);
    if (s.preset === "neon") {
      ctx.shadowColor = color;
      ctx.shadowBlur = px * 0.45;
      ctx.lineWidth = px * 0.05;
      ctx.strokeStyle = "#ffffff";
      ctx.strokeText(w.text, -wW / 2, 0);
    } else if (s.shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = px * 0.18;
      ctx.shadowOffsetY = px * 0.06;
    }
    if (s.stroke > 0) {
      ctx.lineWidth = s.stroke * px;
      ctx.strokeStyle = "#0b0c22";
      ctx.strokeText(w.text, -wW / 2, 0);
      ctx.shadowColor = "transparent";
    }
    ctx.fillStyle = color;
    ctx.fillText(w.text, -wW / 2, 0);
    ctx.restore();
    x += wW + sp;
  });
  ctx.restore();
}

export function drawHook(ctx: Ctx, W: number, H: number, text: string, tOut: number) {
  if (!text || tOut > 3.2) return;
  const alpha = tOut < 0.15 ? tOut / 0.15 : tOut > 2.8 ? Math.max(0, (3.2 - tOut) / 0.4) : 1;
  const px = Math.round(W * 0.052);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `900 ${px}px "HC Anybody", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  // wrap into at most 3 lines
  const maxW = W * 0.78;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const shown = lines.slice(0, 3);
  const lh = px * 1.22;
  const bw = Math.min(W * 0.88, Math.max(...shown.map((l) => ctx.measureText(l).width)) + px * 1.4);
  const bh = shown.length * lh + px * 0.9;
  const by = H * 0.1;
  ctx.fillStyle = "#ffffff";
  rr(ctx, (W - bw) / 2, by, bw, bh, px * 0.45);
  ctx.fill();
  ctx.fillStyle = "#11133a";
  shown.forEach((l, i) => ctx.fillText(l, W / 2, by + px * 0.45 + lh * (i + 0.5)));
  ctx.restore();
}

export function drawProgress(ctx: Ctx, W: number, H: number, frac: number, color: string) {
  const h = Math.max(6, Math.round(H * 0.006));
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.fillRect(0, H - h, W, h);
  ctx.fillStyle = color;
  ctx.fillRect(0, H - h, W * Math.max(0, Math.min(1, frac)), h);
  ctx.restore();
}

export function drawLogo(ctx: Ctx, W: number, H: number, img: CanvasImageSource & { width: number; height: number }) {
  const w = W * 0.16;
  const h = (img.height / img.width) * w;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.drawImage(img, W - w - W * 0.04, H * 0.035, w, h);
  ctx.restore();
}

/* ---------- caption files ---------- */
function ts(t: number, sep: "," | ".") {
  const ms = Math.max(0, Math.round(t * 1000));
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(h)}:${p(m)}:${p(s)}${sep}${p(r, 3)}`;
}

export function toSrt(lines: Line[], map: (t: number) => number) {
  return lines
    .map((l, i) => `${i + 1}\n${ts(map(l.start), ",")} --> ${ts(map(Math.max(l.end, l.start + 0.3)), ",")}\n${l.words.map((w) => w.text).join(" ")}\n`)
    .join("\n");
}

export function toVtt(lines: Line[], map: (t: number) => number) {
  return (
    "WEBVTT\n\n" +
    lines
      .map((l) => `${ts(map(l.start), ".")} --> ${ts(map(Math.max(l.end, l.start + 0.3)), ".")}\n${l.words.map((w) => w.text).join(" ")}\n`)
      .join("\n")
  );
}

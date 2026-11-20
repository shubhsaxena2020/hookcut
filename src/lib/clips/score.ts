import type { Clip, FaceSample, Signals, SignalKey, Word } from "@/lib/types";
import {
  DANGLING_START,
  EMOTION,
  HOOK_PHRASES,
  LAUGH,
  NUMBER_WORDS,
  STOPWORDS,
} from "./lexicon";

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  hook: "Hook",
  payoff: "Payoff",
  energy: "Energy",
  emotion: "Emotion",
  completeness: "Complete thought",
  novelty: "Novelty",
  visual: "Visual",
};

export const WEIGHTS: Signals = {
  hook: 0.24,
  payoff: 0.14,
  energy: 0.16,
  emotion: 0.1,
  completeness: 0.14,
  novelty: 0.12,
  visual: 0.1,
};

const PAD = 0.2;

export type Sentence = { a: number; b: number; start: number; end: number };

const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9'$]/g, "");

export function sentences(words: Word[]): Sentence[] {
  const out: Sentence[] = [];
  let a = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    const endsPunct = /[.?!…]["')\]]?$/.test(w.text);
    const gap = next ? next.start - w.end : Infinity;
    const long = i - a > 40;
    if (endsPunct || gap > 1.0 || long || !next) {
      out.push({ a, b: i, start: words[a].start, end: w.end });
      a = i + 1;
    }
  }
  return out;
}

export type ScoreContext = {
  words: Word[];
  energy: Float32Array;
  faces: FaceSample[];
  cuts: number[];
  duration: number;
  meanEnergy: number;
  p90Energy: number;
  meanRate: number;
  idf: Map<string, number>;
  maxTfidf: number;
};

export function buildContext(
  words: Word[],
  energy: Float32Array,
  faces: FaceSample[],
  cuts: number[],
  duration: number,
): ScoreContext {
  const sorted = Array.from(energy).sort((x, y) => x - y);
  const meanEnergy = sorted.reduce((s, v) => s + v, 0) / Math.max(1, sorted.length) || 1e-4;
  const p90Energy = sorted[Math.floor(sorted.length * 0.9)] || meanEnergy;
  const spoken = words.reduce((s, w) => s + (w.end - w.start), 0);
  const meanRate = words.length / Math.max(1, spoken * 1.25);
  // IDF over sentences
  const sents = sentences(words);
  const df = new Map<string, number>();
  for (const s of sents) {
    const seen = new Set<string>();
    for (let i = s.a; i <= s.b; i++) {
      const t = norm(words[i].text);
      if (t.length < 3 || STOPWORDS.has(t)) continue;
      seen.add(t);
    }
    for (const t of seen) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = Math.max(1, sents.length);
  const idf = new Map<string, number>();
  for (const [t, d] of df) idf.set(t, Math.log((N + 1) / (d + 0.5)));
  return { words, energy, faces, cuts, duration, meanEnergy, p90Energy, meanRate, idf, maxTfidf: Math.log(N + 1) };
}

export function wordsIn(words: Word[] | ScoreContext, start: number, end: number) {
  const list = Array.isArray(words) ? words : words.words;
  // binary search for the first word that ends after `start`
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid].end <= start) lo = mid + 1;
    else hi = mid;
  }
  const out: Word[] = [];
  for (let i = lo; i < list.length; i++) {
    const w = list[i];
    if (w.start >= end) break;
    out.push(w);
  }
  return out;
}

function energyStats(ctx: ScoreContext, a: number, b: number) {
  const i0 = Math.max(0, Math.floor(a * 10));
  const i1 = Math.min(ctx.energy.length, Math.ceil(b * 10));
  let s = 0;
  let peak = 0;
  for (let i = i0; i < i1; i++) {
    s += ctx.energy[i];
    peak = Math.max(peak, ctx.energy[i]);
  }
  const n = Math.max(1, i1 - i0);
  return { mean: s / n, peak };
}

const sat = (x: number) => Math.max(0, Math.min(1, x));

export type Scored = { signals: Signals; raw: number; score: number; reasons: string[]; keyword?: string };

export function scoreWindow(ctx: ScoreContext, start: number, end: number): Scored {
  const ws = wordsIn(ctx, start, end);
  const dur = Math.max(0.1, end - start);
  const reasons: string[] = [];
  const text = (list: Word[]) => list.map((w) => w.text).join(" ");

  // HOOK: first 3 seconds
  const first = ws.filter((w) => w.start < start + 3.2);
  const ft = text(first).toLowerCase();
  let hook = 0;
  const hookWhy: string[] = [];
  if (/\?/.test(ft)) {
    hook += 0.45;
    hookWhy.push("opens with a question");
  }
  if (/!/.test(ft)) {
    hook += 0.25;
    hookWhy.push("opens with an exclamation");
  }
  if (NUMBER_WORDS.test(ft)) {
    hook += 0.2;
    hookWhy.push("leads with a number");
  }
  const phrase = HOOK_PHRASES.find((p) => new RegExp(`\\b${p.replace(/'/g, "'?")}\\b`).test(ft));
  if (phrase) {
    hook += 0.4;
    hookWhy.push(`hook phrase "${phrase}"`);
  }
  if (/\byou(r|'re)?\b/.test(ft)) {
    hook += 0.2;
    hookWhy.push("speaks to the viewer");
  }
  const fe = first.reduce((m, w) => Math.max(m, EMOTION[norm(w.text)] ?? 0), 0);
  if (fe > 0.6) {
    hook += 0.25;
    hookWhy.push("strong emotion up front");
  }
  hook = sat(hook);
  if (hookWhy.length) reasons.push(capitalize(hookWhy.slice(0, 2).join(" and ")));

  // ENERGY
  const e = energyStats(ctx, start, end);
  const rate = ws.length / dur;
  const energy = sat(0.55 * sat((e.mean / ctx.meanEnergy - 0.7) / 0.9) + 0.25 * sat(e.peak / (ctx.p90Energy * 1.6)) + 0.2 * sat((rate / ctx.meanRate - 0.6) / 0.8));
  if (energy > 0.65) reasons.push(e.mean > ctx.meanEnergy * 1.25 ? "Louder and livelier than the rest of the video" : "Fast, energetic delivery");

  // PAYOFF: last 4 seconds
  const tail = energyStats(ctx, Math.max(start, end - 4), end);
  const last = ws.filter((w) => w.start > end - 4.5);
  const lt = text(last);
  let payoff = 0.6 * sat((tail.peak / Math.max(1e-5, e.mean) - 1) / 1.2);
  if (/[!]/.test(lt)) payoff += 0.25;
  if (LAUGH.test(lt)) payoff += 0.35;
  if (/[.!?]$/.test(lt.trim())) payoff += 0.15;
  payoff = sat(payoff);
  if (LAUGH.test(lt)) reasons.push("Ends on a laugh");
  else if (payoff > 0.6) reasons.push("Builds to a reaction at the end");

  // EMOTION
  const emo = ws.reduce((s, w) => s + (EMOTION[norm(w.text)] ?? 0), 0);
  const emotion = sat(emo / Math.max(1, ws.length) / 0.06);
  if (emotion > 0.6) reasons.push("Emotionally charged language");

  // COMPLETENESS
  let completeness = 0.55;
  const w0 = ws[0] ? norm(ws[0].text) : "";
  if (DANGLING_START.has(w0)) completeness -= 0.4;
  else completeness += 0.15;
  if (ws[0] && /^[A-Z0-9"']/.test(ws[0].text)) completeness += 0.1;
  const lastW = ws[ws.length - 1];
  if (lastW && /[.?!]["')]?$/.test(lastW.text)) completeness += 0.25;
  completeness = sat(completeness);
  if (completeness > 0.85) reasons.push("Starts and ends on a complete thought");

  // NOVELTY: mean of top 5 tf-idf terms
  const tf = new Map<string, number>();
  for (const w of ws) {
    const t = norm(w.text);
    if (t.length < 3 || STOPWORDS.has(t)) continue;
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  const terms = [...tf.entries()]
    .map(([t, c]) => [t, (1 + Math.log(c)) * (ctx.idf.get(t) ?? 0)] as const)
    .sort((x, y) => y[1] - x[1]);
  // salience: content words this clip keeps coming back to, weighted by how rare
  // they are in the rest of the video (single mentions say little about topic)
  const repeated = terms.filter(([t]) => (tf.get(t) ?? 0) >= 2).slice(0, 3);
  const novelty = sat(repeated.reduce((s, [, v]) => s + v, 0) / (ctx.maxTfidf * 3));
  const keyword = (repeated[0] ?? terms[0])?.[0];
  if (novelty > 0.6 && keyword) reasons.push(`Distinct topic in this video: "${keyword}"`);

  // VISUAL
  const fs = ctx.faces.filter((f) => f.t >= start && f.t <= end);
  const faceRatio = fs.length ? fs.filter((f) => !("none" in f)).length / fs.length : 0.5;
  const cutCount = ctx.cuts.filter((c) => c >= start && c <= end).length;
  const visual = sat(0.7 * faceRatio + 0.3 * sat(cutCount / Math.max(1, dur / 10)));
  if (fs.length && faceRatio > 0.8) reasons.push(`Speaker on camera ${Math.round(faceRatio * 100)}% of the time`);

  const signals: Signals = { hook, payoff, energy, emotion, completeness, novelty, visual };
  let raw = 0;
  for (const k of Object.keys(WEIGHTS) as SignalKey[]) raw += WEIGHTS[k] * signals[k];
  // short windows with too few words are rarely good clips
  if (ws.length < dur * 1.2) raw *= 0.75;
  const score = Math.round(Math.max(1, Math.min(99, raw * 118)));
  return { signals, raw, score, reasons: reasons.slice(0, 4), keyword };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type Candidate = { start: number; end: number } & Scored;

export function candidateWindows(ctx: ScoreContext, target: number, upTo = Infinity): Candidate[] {
  const sents = sentences(ctx.words).filter((s) => s.end <= upTo);
  const minLen = Math.max(8, target * 0.6);
  const maxLen = target * 1.35;
  const out: Candidate[] = [];
  for (let i = 0; i < sents.length; i++) {
    for (let j = i; j < sents.length; j++) {
      const len = sents[j].end - sents[i].start;
      if (len > maxLen) break;
      if (len < minLen) continue;
      const start = Math.max(0, sents[i].start - PAD);
      const end = Math.min(ctx.duration, sents[j].end + PAD);
      out.push({ start, end, ...scoreWindow(ctx, start, end) });
    }
  }
  return out;
}

const overlap = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  Math.max(0, Math.min(a.end, b.end) - Math.max(a.start, b.start));

/** Non-max suppression: best first, no overlapping clips. */
export function pickClips(cands: Candidate[], count: number, keep: { start: number; end: number }[] = []) {
  const sorted = [...cands].sort((a, b) => b.raw - a.raw);
  const picked: Candidate[] = [];
  const taken = [...keep];
  for (const c of sorted) {
    if (picked.length >= count) break;
    if (taken.some((t) => overlap(t, c) > 0.1 * Math.min(t.end - t.start, c.end - c.start))) continue;
    picked.push(c);
    taken.push(c);
  }
  return picked;
}

export function clipCountFor(duration: number) {
  return Math.max(5, Math.min(20, Math.round((duration / 60) * 1.5)));
}

/** Heuristic title, hook, description and hashtags. */
export function heuristicCopy(ctx: ScoreContext, start: number, end: number, keyword?: string) {
  const ws = wordsIn(ctx, start, end);
  const firstSentence: string[] = [];
  for (const w of ws) {
    firstSentence.push(w.text);
    if (/[.?!]$/.test(w.text) || firstSentence.length >= 12) break;
  }
  let hook = firstSentence.join(" ").replace(/^[,.\s]+/, "");
  if (hook.length > 70) hook = hook.slice(0, 67).replace(/\s+\S*$/, "") + "...";
  const title = hook.replace(/[.,]+$/, "");
  const tags = new Set<string>();
  if (keyword) tags.add(keyword.replace(/[^a-z0-9]/gi, ""));
  for (const w of ws) {
    const t = norm(w.text);
    if (t.length > 5 && !STOPWORDS.has(t) && (ctx.idf.get(t) ?? 0) > 1.2) tags.add(t);
    if (tags.size >= 4) break;
  }
  const hashtags = [...tags].filter(Boolean).map((t) => `#${t}`).concat(["#shorts"]);
  const description = ws
    .map((w) => w.text)
    .join(" ")
    .slice(0, 180)
    .replace(/\s+\S*$/, "...");
  return { title: title || "Untitled clip", hook: title || "", description, hashtags };
}

export type NewClipDefaults = Pick<Clip, "captions" | "layout" | "removeFillers" | "removeSilences" | "showHook" | "showProgress" | "fps">;

export function makeClip(ctx: ScoreContext, c: Candidate, defaults: NewClipDefaults): Clip {
  const copy = heuristicCopy(ctx, c.start, c.end, c.keyword);
  return {
    id: `c${Math.round(c.start * 10)}-${Math.round(c.end * 10)}`,
    start: c.start,
    end: c.end,
    score: c.score,
    signals: c.signals,
    reasons: c.reasons.length ? c.reasons : ["Balanced across all signals"],
    ...copy,
    edits: {},
    ...structuredClone(defaults),
  };
}

/** Run the full finder. `keep` clips (touched by the user) are preserved. */
export function findClips(
  ctx: ScoreContext,
  target: number,
  defaults: NewClipDefaults,
  keep: Clip[] = [],
  upTo = Infinity,
) {
  const count = clipCountFor(Math.min(ctx.duration, upTo === Infinity ? ctx.duration : upTo));
  const cands = candidateWindows(ctx, target, upTo);
  const picked = pickClips(cands, Math.max(0, count - keep.length), keep);
  const fresh = picked.map((p) => makeClip(ctx, p, defaults));
  return [...keep, ...fresh].sort((a, b) => b.score - a.score);
}

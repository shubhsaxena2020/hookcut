import type { Clip, Word } from "@/lib/types";
import { isFiller } from "@/lib/captions/render";
import { wordsIn } from "./score";

export type Seg = { a: number; b: number; out: number };

/** Source-time ranges kept in the export, after filler and silence removal. */
export function keptSegments(words: Word[], clip: Clip): Seg[] {
  const remove: [number, number][] = [];
  const ws = wordsIn(words, clip.start, clip.end);
  if (clip.removeFillers) {
    for (const w of ws) {
      const e = clip.edits[w.id];
      if (isFiller(e?.text ?? w.text) || e?.cut) remove.push([w.start, w.end]);
    }
  }
  if (clip.removeSilences) {
    const KEEP = 0.15;
    for (let i = 0; i + 1 < ws.length; i++) {
      const gap = ws[i + 1].start - ws[i].end;
      if (gap > 0.6) remove.push([ws[i].end + KEEP, ws[i + 1].start - KEEP]);
    }
  }
  remove.sort((x, y) => x[0] - y[0]);
  const segs: Seg[] = [];
  let cur = clip.start;
  let out = 0;
  for (const [a, b] of remove) {
    if (b <= cur) continue;
    if (a > cur + 0.08) {
      segs.push({ a: cur, b: Math.min(a, clip.end), out });
      out += Math.min(a, clip.end) - cur;
    }
    cur = Math.max(cur, b);
    if (cur >= clip.end) break;
  }
  if (clip.end - cur > 0.05) segs.push({ a: cur, b: clip.end, out });
  return segs;
}

export function outDuration(segs: Seg[]) {
  const l = segs[segs.length - 1];
  return l ? l.out + (l.b - l.a) : 0;
}

/** Source time to output time, or null when the moment is cut. */
export function srcToOut(segs: Seg[], t: number): number | null {
  for (const s of segs) if (t >= s.a - 1e-4 && t < s.b) return s.out + (t - s.a);
  return null;
}

/** Same as srcToOut, but snaps cut moments to the next kept moment (for caption files). */
export function srcToOutClamped(segs: Seg[], t: number): number {
  for (const s of segs) {
    if (t < s.a) return s.out;
    if (t < s.b) return s.out + (t - s.a);
  }
  return outDuration(segs);
}

export function outToSrc(segs: Seg[], o: number): number {
  for (const s of segs) if (o < s.out + (s.b - s.a)) return s.a + Math.max(0, o - s.out);
  const l = segs[segs.length - 1];
  return l ? l.b : 0;
}

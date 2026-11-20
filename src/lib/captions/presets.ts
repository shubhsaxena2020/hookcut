import type { CaptionPreset, CaptionSettings, LayoutSettings } from "@/lib/types";

export const PRESETS: Record<CaptionPreset, { label: string; blurb: string; settings: Omit<CaptionSettings, "preset"> }> = {
  "bold-pop": {
    label: "Bold Pop",
    blurb: "Heavy white type, the spoken word pops in yellow",
    settings: {
      font: "Anybody", size: 0.058, color: "#ffffff", highlight: "#ffe14a", keywordColor: "#5eead4",
      emphasizeKeywords: true, emoji: false, wordsPerLine: 3, y: 0.7, stroke: 0.16, shadow: true,
      uppercase: true, profanityFilter: false,
    },
  },
  karaoke: {
    label: "Karaoke",
    blurb: "Words fill with colour as they are spoken",
    settings: {
      font: "Archivo Black", size: 0.05, color: "#ffffff", highlight: "#4ade80", keywordColor: "#ffe14a",
      emphasizeKeywords: false, emoji: false, wordsPerLine: 3, y: 0.72, stroke: 0.14, shadow: true,
      uppercase: false, profanityFilter: false,
    },
  },
  minimal: {
    label: "Minimal",
    blurb: "Clean sentence case with a soft shadow",
    settings: {
      font: "Instrument Sans", size: 0.042, color: "#ffffff", highlight: "#ffffff", keywordColor: "#ffffff",
      emphasizeKeywords: false, emoji: false, wordsPerLine: 3, y: 0.76, stroke: 0, shadow: true,
      uppercase: false, profanityFilter: false,
    },
  },
  neon: {
    label: "Neon",
    blurb: "Glowing outline type for night-time energy",
    settings: {
      font: "Anybody", size: 0.054, color: "#f0abfc", highlight: "#67e8f9", keywordColor: "#fde047",
      emphasizeKeywords: true, emoji: false, wordsPerLine: 2, y: 0.68, stroke: 0, shadow: true,
      uppercase: true, profanityFilter: false,
    },
  },
  boxed: {
    label: "Boxed",
    blurb: "Lines sit on solid boxes, readable on any footage",
    settings: {
      font: "Archivo Black", size: 0.045, color: "#ffffff", highlight: "#ffe14a", keywordColor: "#ffe14a",
      emphasizeKeywords: false, emoji: false, wordsPerLine: 3, y: 0.74, stroke: 0, shadow: false,
      uppercase: false, profanityFilter: false,
    },
  },
  gaming: {
    label: "Gaming",
    blurb: "Comic-style punch with a thick outline",
    settings: {
      font: "Bangers", size: 0.064, color: "#ffffff", highlight: "#facc15", keywordColor: "#f87171",
      emphasizeKeywords: true, emoji: true, wordsPerLine: 2, y: 0.66, stroke: 0.2, shadow: true,
      uppercase: true, profanityFilter: false,
    },
  },
  "big-punch": {
    label: "Big Punch",
    blurb: "One huge word at a time, made for fast talkers",
    settings: {
      font: "Anton", size: 0.085, color: "#ffffff", highlight: "#a3e635", keywordColor: "#facc15",
      emphasizeKeywords: true, emoji: false, wordsPerLine: 1, y: 0.62, stroke: 0.12, shadow: true,
      uppercase: true, profanityFilter: false,
    },
  },
  "lower-third": {
    label: "Lower Third",
    blurb: "A quiet subtitle bar near the bottom",
    settings: {
      font: "Instrument Sans", size: 0.034, color: "#ffffff", highlight: "#ffffff", keywordColor: "#ffffff",
      emphasizeKeywords: false, emoji: false, wordsPerLine: 3, y: 0.86, stroke: 0, shadow: false,
      uppercase: false, profanityFilter: false,
    },
  },
};

export const PRESET_ORDER = Object.keys(PRESETS) as CaptionPreset[];

export function presetSettings(preset: CaptionPreset): CaptionSettings {
  return { preset, ...PRESETS[preset].settings };
}

export const FONT_OPTIONS = ["Anybody", "Anton", "Archivo Black", "Bangers", "Instrument Sans"] as const;

export const FONT_FILES: Record<string, { file: string; weight: string }> = {
  Anybody: { file: "/fonts/anybody-900.woff2", weight: "900" },
  Anton: { file: "/fonts/anton.woff2", weight: "400" },
  "Archivo Black": { file: "/fonts/archivo-black.woff2", weight: "400" },
  Bangers: { file: "/fonts/bangers.woff2", weight: "400" },
  "Instrument Sans": { file: "/fonts/instrument-600.woff2", weight: "600" },
};

let fontsReady: Promise<void> | null = null;
/** The document's or the worker's font set, if this context has one. */
export function fontSet(): FontFaceSet | null {
  if (typeof FontFace === "undefined") return null;
  if (typeof document !== "undefined") return document.fonts;
  return (globalThis as { fonts?: FontFaceSet }).fonts ?? null;
}

/** Load caption fonts under "HC <name>" (in the page or a worker) so canvas text is consistent. */
export function loadCaptionFonts() {
  const set = fontSet();
  if (!set) return Promise.resolve();
  if (!fontsReady) {
    fontsReady = Promise.all(
      Object.entries(FONT_FILES).map(async ([name, f]) => {
        const face = new FontFace(`HC ${name}`, `url(${f.file})`, { weight: f.weight });
        await face.load();
        set.add(face);
      }),
    ).then(() => undefined);
  }
  return fontsReady;
}

export function defaultLayout(): LayoutSettings {
  return { mode: "auto", aspect: "9:16", facecam: { x: 0.68, y: 0.05, w: 0.3, h: 0.3 }, split: 0.4 };
}

export const ASPECTS: Record<string, { w: number; h: number }> = {
  "9:16": { w: 1080, h: 1920 },
  "1:1": { w: 1080, h: 1080 },
  "4:5": { w: 1080, h: 1350 },
};

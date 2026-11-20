export type Word = {
  id: number;
  text: string;
  start: number;
  end: number;
};

/** Per-clip edits layered over the shared transcript, so timing never changes. */
export type WordEdit = {
  text?: string;
  /** "split" forces a new caption line before this word, "join" keeps it on the previous line */
  brk?: "split" | "join";
  /** removed from captions (and from audio when filler removal is on) */
  cut?: boolean;
};

export type SignalKey =
  | "hook"
  | "payoff"
  | "energy"
  | "emotion"
  | "completeness"
  | "novelty"
  | "visual";

export type Signals = Record<SignalKey, number>;

export type CaptionPreset =
  | "bold-pop"
  | "karaoke"
  | "minimal"
  | "neon"
  | "boxed"
  | "gaming"
  | "big-punch"
  | "lower-third";

export type CaptionFont = "Anybody" | "Anton" | "Archivo Black" | "Bangers" | "Instrument Sans";

export type CaptionSettings = {
  preset: CaptionPreset;
  font: CaptionFont;
  /** font size as a fraction of output height */
  size: number;
  color: string;
  highlight: string;
  keywordColor: string;
  emphasizeKeywords: boolean;
  emoji: boolean;
  wordsPerLine: 1 | 2 | 3;
  /** vertical centre of the caption block, 0 top .. 1 bottom */
  y: number;
  stroke: number;
  shadow: boolean;
  uppercase: boolean;
  profanityFilter: boolean;
};

export type LayoutMode = "auto" | "center" | "fit-blur" | "stacked";
export type AspectKey = "9:16" | "1:1" | "4:5";

export type Rect = { x: number; y: number; w: number; h: number };

export type LayoutSettings = {
  mode: LayoutMode;
  aspect: AspectKey;
  /** facecam box in normalised source coordinates (stacked mode) */
  facecam: Rect;
  /** share of the frame given to the facecam in stacked mode */
  split: number;
};

export type Clip = {
  id: string;
  start: number;
  end: number;
  score: number;
  signals: Signals;
  reasons: string[];
  title: string;
  hook: string;
  description: string;
  hashtags: string[];
  ai?: { score: number; reason: string };
  edits: Record<number, WordEdit>;
  captions: CaptionSettings;
  layout: LayoutSettings;
  removeFillers: boolean;
  removeSilences: boolean;
  showHook: boolean;
  showProgress: boolean;
  fps: 30 | 60;
  /** the user changed this clip, so re-scoring must keep it */
  touched?: boolean;
};

export type AiCopy = { title: string; hook: string; score: number; reason: string };

export type FaceSample = { t: number; x: number; y: number; w: number; h: number; s: number } | { t: number; none: true };

export type ProjectMeta = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  duration: number;
  width: number;
  height: number;
  clipCount: number;
};

export type Project = ProjectMeta & {
  file: Blob;
  fileType: string;
  words: Word[];
  /** RMS energy at 10 Hz */
  energy: Float32Array;
  faces: FaceSample[];
  cuts: number[];
  clips: Clip[];
  transcribed: boolean;
  lang: string;
  /** language found by auto-detect (undefined until known, null if detection failed) */
  detectedLang?: string | null;
  /** AI re-rank results by clip id, so titles survive re-scoring */
  aiCopy?: Record<string, AiCopy>;
  model: ModelSize;
  targetLength: 15 | 30 | 60 | 90;
};

export type ModelSize = "tiny" | "base" | "small";

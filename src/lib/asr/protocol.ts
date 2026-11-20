import type { ModelSize, Word } from "@/lib/types";

export type AsrRequest = {
  type: "start";
  file: Blob;
  model: ModelSize;
  /** "auto" or an ISO language code */
  lang: string;
  /** skip transcription and only decode audio (used when a project is resumed) */
  audioOnly?: boolean;
};

export type AsrEvent =
  | { type: "stage"; stage: "decode" | "model" | "transcribe"; progress: number; detail?: string }
  | { type: "audio"; duration: number; energy: Float32Array }
  | { type: "device"; device: "webgpu" | "wasm" }
  | { type: "words"; words: Word[]; upTo: number }
  | { type: "done" }
  | { type: "error"; message: string };

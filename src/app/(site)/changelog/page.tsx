import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog",
  description: "What is new in Hookcut.",
  alternates: { canonical: "/changelog" },
};

const ENTRIES = [
  {
    date: "20 November 2026",
    version: "1.0",
    title: "Hookcut launches",
    items: [
      "Browser studio: drop a video, get scored clips while transcription is still running.",
      "Whisper transcription with word timestamps on WebGPU, with a WebAssembly fallback.",
      "Explainable clip score across seven signals, with live rescoring when you trim.",
      "Eight caption styles, inline word editing, find and replace, line split and merge, profanity filter.",
      "Auto face, center, fit-blur and stacked facecam layouts at 9:16, 1:1 and 4:5.",
      "Filler word and silence removal, hook title overlay and progress bar.",
      "Hardware-encoded MP4 export, batch export, SRT and VTT files.",
      "Brand kit and projects saved locally in your browser.",
      "Optional AI titles and re-ranking that sends transcript text only.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight">Changelog</h1>
      <ol className="mt-10 space-y-12">
        {ENTRIES.map((e) => (
          <li key={e.version} className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <div className="text-sm text-muted">
              <time>{e.date}</time>
              <div className="mt-1 font-semibold text-ink">Version {e.version}</div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">{e.title}</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink-2">
                {e.items.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

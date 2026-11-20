/**
 * The hero's live demo: a vertical clip with karaoke captions on top, and the
 * source timeline below where Hookcut scores candidate windows. Pure CSS motion,
 * so it costs no JavaScript on the landing page.
 */
const WORDS = ["wait,", "this", "one", "trick", "saved", "my", "whole", "stream"];

function waveform(n: number) {
  // deterministic pseudo-random bars (no Math.random so the markup is stable)
  const bars: number[] = [];
  let s = 7;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const env = 0.45 + 0.55 * Math.abs(Math.sin(i / 9)) * (i % 37 > 30 ? 1.4 : 1);
    bars.push(Math.min(1, 0.15 + r * 0.55 * env + (i > 70 && i < 86 ? 0.35 : 0)));
  }
  return bars;
}

const BARS = waveform(120);
const WINDOWS = [
  { from: 8, to: 30, score: 74 },
  { from: 64, to: 90, score: 93 },
  { from: 98, to: 116, score: 81 },
];

export function HeroDemo() {
  const perWord = 4.8 / WORDS.length;
  return (
    <div className="relative mx-auto w-full max-w-[460px]" aria-hidden="true">
      {/* Phone / vertical clip */}
      <div className="relative mx-auto aspect-[9/16] w-[62%] overflow-hidden rounded-[28px] border-[6px] border-ink bg-cobalt-deep shadow-[0_30px_60px_-30px_rgba(17,19,58,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_70%_at_50%_10%,#3b49f0_0%,#161e8c_55%,#0d0f2e_100%)]" />
        {/* stylised speaker, gently tracked by the auto-reframe */}
        <div className="demo-track absolute inset-x-0 top-[16%] flex justify-center">
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-[#f6c9a8]" />
            <div className="mx-auto -mt-2 h-28 w-40 rounded-t-[60px] bg-[#ff4f7b]" />
            <div className="absolute -inset-3 rounded-2xl border-2 border-dashed border-mark/80" />
          </div>
        </div>
        <div className="absolute left-3 top-3 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-mark">
          face tracked
        </div>
        <p className="font-display absolute inset-x-2 bottom-[18%] text-center text-[19px] font-black uppercase leading-[1.25] text-white [text-shadow:0_2px_0_#11133a]">
          {WORDS.map((w, i) => (
            <span key={i} className="demo-word" style={{ animationDelay: `${i * perWord}s` }}>
              {w}{" "}
            </span>
          ))}
        </p>
      </div>

      {/* Source timeline with scored windows */}
      <div className="relative mt-5 rounded-2xl border border-line bg-white p-3">
        <div className="relative h-14">
          <svg viewBox="0 0 240 56" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
            {BARS.map((b, i) => (
              <rect
                key={i}
                x={i * 2}
                width="1.2"
                y={28 - b * 26}
                height={b * 52}
                fill="#2a2d5c"
                opacity="0.55"
              />
            ))}
          </svg>
          {WINDOWS.map((w, i) => (
            <div
              key={i}
              className="demo-window absolute inset-y-0 rounded-md border-2"
              style={{
                left: `${(w.from / 120) * 100}%`,
                width: `${((w.to - w.from) / 120) * 100}%`,
                borderColor: w.score > 90 ? "var(--cobalt)" : "#8a90c8",
                background: w.score > 90 ? "rgba(36,51,214,0.12)" : "rgba(138,144,200,0.10)",
                animationDelay: `${i * 0.9}s`,
              }}
            >
              <span
                className="absolute -top-3 left-1 rounded px-1 text-[11px] font-bold leading-5"
                style={{
                  background: w.score > 90 ? "var(--mark)" : "var(--paper-2)",
                  color: "var(--ink)",
                }}
              >
                {w.score}
              </span>
            </div>
          ))}
          <div className="pointer-events-none absolute inset-y-[-6px] inset-x-0 overflow-hidden">
            <div className="demo-playhead h-full w-full">
              <div className="h-full w-0.5 bg-hot" />
            </div>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-muted">
          <span>2:14:07 stream</span>
          <span>14 clips found</span>
        </div>
      </div>
    </div>
  );
}

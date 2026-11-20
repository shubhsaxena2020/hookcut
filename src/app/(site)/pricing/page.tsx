import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Hookcut is free: unlimited clips, no credits, no watermark. Everything runs in your browser, so there is no per-minute bill to pass on.",
  alternates: { canonical: "/pricing" },
};

const FREE = [
  "Unlimited source videos and clips",
  "No credits and no watermark",
  "Word-level captions with 8 styles",
  "Auto face reframe, fit-blur and stacked facecam layouts",
  "1080 by 1920 MP4 export at 30 or 60 fps",
  "SRT and VTT caption files",
  "Batch export, brand kit and local projects",
  "Optional AI titles and re-ranking (transcript text only)",
];

const PRO = [
  "Sync projects across your devices",
  "Post straight to YouTube, TikTok and Instagram",
  "Shared brand kits for teams",
  "An API for automated clipping",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl">Pricing</h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-2">
        Cloud clippers charge per minute because they rent GPUs to process your upload. Hookcut uses
        your own computer, so the studio costs us almost nothing to run. That is why it is free.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="rounded-3xl border-2 border-ink bg-white p-8" aria-labelledby="free-plan">
          <h2 id="free-plan" className="font-display text-2xl font-extrabold">
            Free
          </h2>
          <p className="mt-2">
            <span className="font-display text-5xl font-black">$0</span>
            <span className="ml-2 text-muted">forever, for the browser studio</span>
          </p>
          <ul className="mt-6 space-y-2.5">
            {FREE.map((f) => (
              <li key={f} className="flex gap-3">
                <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0" aria-hidden="true">
                  <path d="M4 10.5l4 4 8-9" fill="none" stroke="#2433d6" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>
          <Link
            prefetch={false}
            href="/app"
            className="mt-8 inline-block rounded-full bg-cobalt px-6 py-3 font-semibold text-white hover:bg-cobalt-deep"
          >
            Open the studio
          </Link>
        </section>

        <section className="rounded-3xl bg-paper-2 p-8" aria-labelledby="pro-plan">
          <h2 id="pro-plan" className="font-display text-2xl font-extrabold">
            Pro
          </h2>
          <p className="mt-2 text-muted">Coming later. Not available to buy yet.</p>
          <ul className="mt-6 space-y-2.5 text-ink-2">
            {PRO.map((f) => (
              <li key={f} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2" />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-2">
            Want to hear when it launches? We do not keep a mailing list yet, so just write to us and
            we will reply when Pro is ready.
          </p>
          <a
            href="mailto:hello@hookcut.app?subject=Hookcut%20Pro%20waitlist"
            className="mt-4 inline-block rounded-full border border-ink/30 px-5 py-2.5 font-semibold hover:border-ink"
          >
            Email to join the waitlist
          </a>
        </section>
      </div>
    </div>
  );
}

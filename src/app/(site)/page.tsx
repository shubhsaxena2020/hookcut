import Link from "next/link";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { SITE } from "@/lib/site";

const FAQ: [string, string][] = [
  [
    "Is my video uploaded anywhere?",
    "No. Hookcut decodes, transcribes, scores and renders inside your browser tab. The video file stays on your device. The only optional network step is AI re-ranking, which sends transcript text (never audio or video) and can be switched off.",
  ],
  [
    "What do I need to run it?",
    "A recent Chrome, Edge or Safari 17+ on a laptop or desktop. Hookcut uses WebCodecs for hardware video encoding and WebGPU for fast transcription when available, and falls back to WebAssembly when it is not.",
  ],
  [
    "How long can my source video be?",
    "Up to about two hours. Longer files work but take more memory. Transcription speed depends on your machine: with WebGPU, a one-hour podcast usually transcribes in a few minutes.",
  ],
  [
    "Why are the captions more accurate?",
    "Every caption word carries its own timestamp from the speech model. When you fix a word, only the text changes, so nothing drifts out of sync. You can also find and replace names across the whole clip in one go.",
  ],
  [
    "Is it really free?",
    "Yes. Because the heavy work runs on your machine, there are no servers to pay for per minute. There are no credits, no watermark and no export limit. A paid Pro plan for cloud sync and team features is planned, and the free studio stays free.",
  ],
  [
    "Can I clip YouTube links?",
    "Not directly. Browsers cannot download YouTube videos, so Hookcut asks for the file itself. If you own the video, download it from YouTube Studio and drop it in.",
  ],
];

const COMPARE: [string, string, string][] = [
  ["Where your video goes", "Stays on your device", "Uploaded to their servers"],
  ["Time before first clips", "Seconds after transcription starts", "Upload, then wait in a queue"],
  ["Pricing model", "Free, no credits", "Monthly credits, about 1 per source minute"],
  ["Watermark on free exports", "None", "Usually yes"],
  ["Fixing a caption word", "Timing locked to the word", "Edits can drift out of sync"],
  ["Why a clip was picked", "Signal-by-signal breakdown", "A single score"],
  [
    "Streamer facecam layout",
    "Stacked facecam plus AI picks, unlimited and local",
    "Offered by some tools, usually metered by credits",
  ],
  ["Works offline after load", "Yes, except optional AI re-rank", "No"],
];

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Hookcut",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web browser (Chrome, Edge, Safari 17+)",
    url: SITE.url,
    description: SITE.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    featureList: [
      "Automatic clip finding with explainable virality score",
      "Word-level animated captions",
      "Face-tracked reframe to 9:16, 1:1 and 4:5",
      "Stacked gameplay and facecam layout",
      "MP4, SRT and VTT export",
    ],
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqLd]) }}
      />

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.15fr_1fr] md:pt-20">
        <div>
          <h1 className="font-display text-[2.6rem] font-black leading-[1.02] tracking-[-0.02em] text-ink sm:text-[3.6rem] lg:text-[4.3rem]">
            Long video in.
            <br />
            Shorts that hook, out.
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg text-ink-2">
            Hookcut finds the strongest moments in your podcast, stream or talk, captions every word
            and reframes it to vertical. It all runs in your browser: no upload, no queue, no credits,
            no watermark.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/app"
              className="rounded-full bg-cobalt px-6 py-3 text-base font-semibold text-white shadow-[0_8px_24px_-10px_rgba(36,51,214,0.8)] transition-colors hover:bg-cobalt-deep"
            >
              Clip a video now
            </Link>
            <a
              href="#how"
              className="rounded-full border border-ink/20 px-6 py-3 text-base font-semibold text-ink hover:border-ink"
            >
              See how it works
            </a>
          </div>
          <p className="mt-5 text-sm text-muted">
            Free and unlimited. Works in Chrome, Edge and Safari 17+. No account needed.
          </p>
        </div>
        <HeroDemo />
      </section>

      {/* How it works: a real sequence, so it is numbered */}
      <section id="how" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps, one browser tab
          </h2>
          <ol className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              [
                "Drop your video",
                "MP4, MOV, WebM or MKV, up to about two hours. It opens instantly, because nothing is uploaded.",
              ],
              [
                "Hookcut listens and scores",
                "Whisper transcribes with word timestamps while candidate clips appear and rank themselves on hook, payoff, energy, emotion and completeness.",
              ],
              [
                "Polish and export",
                "Pick a caption style, fix any word, choose a layout and export 1080 by 1920 MP4s with hardware encoding. Or export them all at once.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="relative pl-14">
                <span className="font-display absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-mark text-lg font-black text-ink">
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold">{t}</h3>
                <p className="mt-2 text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">
          Built around the parts other clippers get wrong
        </h2>
        <div className="mt-12 grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-3xl bg-ink p-8 text-night-text sm:p-10">
            <h3 className="font-display text-2xl font-extrabold">Captions you can fix without drift</h3>
            <p className="mt-3 text-night-muted">
              Each word keeps its own start and end time. Correct a name, merge two lines or run find
              and replace, and the timing stays exactly where the speaker said it.
            </p>
            <div className="mt-8 rounded-2xl bg-night-1 p-5">
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  ["so", "0:12.4"],
                  ["Kaylee", "0:12.6"],
                  ["built", "0:13.1"],
                  ["the", "0:13.3"],
                  ["whole", "0:13.4"],
                  ["thing", "0:13.7"],
                ].map(([w, t], i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-2.5 py-1.5 ${i === 1 ? "bg-mark text-ink" : "bg-night-2"}`}
                  >
                    <span className="font-semibold">{w}</span>
                    <span className={`ml-1.5 text-xs ${i === 1 ? "text-ink-2" : "text-night-muted"}`}>
                      {t}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs text-night-muted">
                Edited from &ldquo;Kaley&rdquo;. The timestamp did not move.
              </p>
            </div>
          </div>
          <dl className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
            {[
              [
                "Clip picks you can audit",
                "Every clip shows why it scored: hook, payoff, energy, emotion, completeness, novelty and visuals. Drag the edges and the score updates live.",
              ],
              [
                "Streamer stacked layout",
                "Draw a box over your webcam once. Hookcut stacks it above the gameplay on every clip it finds, with no export limit.",
              ],
              [
                "Face-tracked reframe",
                "Auto mode follows the speaker with smoothed motion. Center, fit with blurred background and stacked are one click away.",
              ],
              [
                "Eight caption styles",
                "From a loud punch style to a quiet lower third, with keyword colour, emoji, size, stroke and position controls.",
              ],
              [
                "Filler and silence cutting",
                "Remove ums, uhs and pauses longer than 0.6 seconds from a clip with one toggle.",
              ],
              [
                "Your brand, saved locally",
                "Your logo, colours, font and default caption style apply to every new clip.",
              ],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="text-lg font-semibold">{t}</dt>
                <dd className="mt-1.5 text-ink-2">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Hookcut and typical cloud clippers
          </h2>
          <p className="mt-3 max-w-2xl text-ink-2">
            Most clipping tools upload your video and process it on their servers, which is why they
            charge by the minute. Hookcut does the work on your computer instead.
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-left">
              <caption className="sr-only">Comparison of Hookcut with typical cloud clipping tools</caption>
              <thead>
                <tr className="border-b-2 border-ink text-sm">
                  <th scope="col" className="py-3 pr-4 font-semibold text-muted">
                    <span className="sr-only">What you get</span>
                  </th>
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Hookcut
                  </th>
                  <th scope="col" className="py-3 font-semibold text-muted">
                    Typical cloud clipper
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([k, a, b]) => (
                  <tr key={k} className="border-b border-line">
                    <th scope="row" className="py-3.5 pr-4 font-medium text-ink-2">
                      {k}
                    </th>
                    <td className="py-3.5 pr-4 font-semibold text-ink">{a}</td>
                    <td className="py-3.5 text-muted">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section id="privacy" className="bg-cobalt text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              Your footage stays on your machine
            </h2>
            <p className="mt-4 max-w-md text-white/85">
              Unreleased episodes, client work, private streams: none of it is sent anywhere. Hookcut
              has no upload endpoint for video at all. Projects are saved in your browser&apos;s own
              storage, and you can delete them at any time.
            </p>
          </div>
          <ol className="space-y-3 text-[0.98rem]">
            {[
              ["Your video file", "read by the browser tab"],
              ["Decode, transcribe, score", "on your CPU and GPU"],
              ["Render and encode", "with your hardware encoder"],
              ["Your downloads folder", "the MP4 lands here"],
            ].map(([a, b]) => (
              <li key={a} className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4">
                <span className="font-semibold">{a}</span>
                <span className="ml-auto text-right text-sm text-white/75">{b}</span>
              </li>
            ))}
            <li className="rounded-2xl border border-dashed border-white/40 px-5 py-4 text-sm text-white/80">
              Optional: transcript text only, sent for AI titles and re-ranking. Off with one switch.
            </li>
          </ol>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q}
                <span className="text-2xl leading-none text-cobalt transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-mark px-8 py-12 sm:flex-row sm:items-center sm:px-12">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
              Your next ten Shorts are already in that video
            </h2>
            <p className="mt-2 text-ink-2">Open the studio and drop it in. No sign-up.</p>
          </div>
          <Link
            href="/app"
            className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-base font-semibold text-paper hover:bg-cobalt-deep"
          >
            Open the studio
          </Link>
        </div>
      </section>
    </>
  );
}

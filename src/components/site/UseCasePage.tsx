import type { Metadata } from "next";
import Link from "next/link";
import type { UseCase } from "@/lib/usecases";
import { SITE } from "@/lib/site";

export function caseMetadata(u: UseCase): Metadata {
  return {
    title: { absolute: `${u.metaTitle} | Hookcut` },
    description: u.description,
    alternates: { canonical: `/${u.slug}` },
    openGraph: { type: "website", title: u.title, description: u.description, url: `/${u.slug}` },
    twitter: { card: "summary_large_image", title: u.title, description: u.description },
  };
}

/** Tool-style landing page for one use case, with a CTA that opens the studio preset. */
export function UseCasePage({ u }: { u: UseCase }) {
  const href = `/app?preset=${u.preset}`;
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `Hookcut: ${u.kicker}`,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web browser (Chrome, Edge, Safari 17+)",
      url: `${SITE.url}/${u.slug}`,
      description: u.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: u.title,
      step: u.steps.map(([name, text], i) => ({ "@type": "HowToStep", position: i + 1, name, text })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: u.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="mx-auto max-w-5xl px-4 pb-14 pt-12 sm:px-6 md:pt-16">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cobalt">{u.kicker}</p>
        <h1 className="font-display mt-3 max-w-3xl text-[2.4rem] font-black leading-[1.04] tracking-tight sm:text-5xl">{u.title}</h1>
        <p className="mt-5 max-w-2xl text-lg text-ink-2">{u.lead}</p>
        <div className="mt-8 rounded-3xl border-2 border-ink bg-white p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-semibold text-ink">Free, no account, no watermark</p>
            <p className="mt-1 text-sm text-muted">{u.presetNote}</p>
          </div>
          <Link
            prefetch={false}
            href={href}
            className="mt-4 inline-block shrink-0 rounded-full bg-cobalt px-6 py-3 font-semibold text-white hover:bg-cobalt-deep sm:mt-0"
          >
            {u.cta}
          </Link>
        </div>
      </section>

      <section className="border-y border-line bg-white" aria-labelledby="steps-h">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 id="steps-h" className="font-display text-3xl font-extrabold tracking-tight">
            How it works
          </h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-2">
            {u.steps.map(([t, d], i) => (
              <li key={t} className="relative pl-14">
                <span className="font-display absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-mark text-lg font-black text-ink">
                  {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{t}</h3>
                <p className="mt-1.5 text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6" aria-labelledby="why-h">
        <h2 id="why-h" className="font-display text-3xl font-extrabold tracking-tight">
          What you get
        </h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2">
          {u.points.map(([t, d]) => (
            <div key={t}>
              <dt className="text-lg font-semibold">{t}</dt>
              <dd className="mt-1.5 text-ink-2">{d}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 rounded-3xl bg-paper-2 p-7">
          <h2 className="font-display text-xl font-extrabold">Good to know</h2>
          <ul className="mt-4 space-y-3 text-ink-2">
            {u.limits.map((l) => (
              <li key={l.text} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2" />
                <span>
                  {l.text}
                  {l.source && (
                    <>
                      {" "}
                      <a href={l.source.url} rel="noopener" target="_blank" className="text-sm text-muted underline underline-offset-2 hover:text-cobalt">
                        Source: {l.source.label}
                      </a>
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-14 sm:px-6" aria-labelledby="faq-h">
        <h2 id="faq-h" className="font-display text-3xl font-extrabold tracking-tight">
          Questions
        </h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {u.faq.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q}
                <span className="text-2xl leading-none text-cobalt transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted">
          Read next:{" "}
          {u.related.map((r, i) => (
            <span key={r.href}>
              {i > 0 && " · "}
              <Link href={r.href} className="underline underline-offset-2 hover:text-cobalt">
                {r.label}
              </Link>
            </span>
          ))}
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-mark px-8 py-10 sm:flex-row sm:items-center">
          <h2 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">Drop in a video and see what it finds</h2>
          <Link prefetch={false} href={href} className="shrink-0 rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-cobalt-deep">
            Open the studio
          </Link>
        </div>
      </section>
    </>
  );
}

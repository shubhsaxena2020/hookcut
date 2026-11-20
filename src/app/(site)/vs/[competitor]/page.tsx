import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CHECKED, COMPETITORS, PRICE_NOTE, getCompetitor } from "@/lib/compare";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/vs/[competitor]">): Promise<Metadata> {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) return {};
  return {
    title: c.title,
    description: c.description,
    alternates: { canonical: `/vs/${c.slug}` },
    openGraph: { type: "article", title: `Hookcut vs ${c.name}`, description: c.description, url: `/vs/${c.slug}` },
    twitter: { card: "summary_large_image", title: `Hookcut vs ${c.name}`, description: c.description },
  };
}

export default async function ComparePage({ params }: PageProps<"/vs/[competitor]">) {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  if (!c) notFound();
  const others = COMPETITORS.filter((o) => o.slug !== c.slug);
  const ld = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: c.title,
      description: c.description,
      url: `${SITE.url}/vs/${c.slug}`,
      dateModified: CHECKED,
      about: { "@type": "SoftwareApplication", name: "Hookcut", applicationCategory: "MultimediaApplication", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: c.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Hookcut", item: SITE.url },
        { "@type": "ListItem", position: 2, name: `Hookcut vs ${c.name}`, item: `${SITE.url}/vs/${c.slug}` },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-cobalt">Hookcut vs {c.name}</p>
      <h1 className="font-display mt-3 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">{c.title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-ink-2">{c.intro}</p>
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Link prefetch={false} href="/app" className="rounded-full bg-cobalt px-6 py-3 font-semibold text-white hover:bg-cobalt-deep">
          Try Hookcut free
        </Link>
        <a href="#table" className="rounded-full border border-ink/20 px-6 py-3 font-semibold hover:border-ink">
          See the comparison
        </a>
      </div>

      <section id="table" className="mt-14" aria-labelledby="table-h">
        <h2 id="table-h" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Side by side
        </h2>
        <p className="mt-2 text-sm text-muted">
          Checked on {CHECKED}. Every {c.name} cell links to its source. Prices: {PRICE_NOTE.toLowerCase()}.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Comparison of Hookcut and {c.name}</caption>
            <thead>
              <tr className="border-b-2 border-ink text-sm">
                <th scope="col" className="w-[24%] py-3 pr-4 font-semibold text-muted">
                  <span className="sr-only">Feature</span>
                </th>
                <th scope="col" className="w-[34%] py-3 pr-4 font-semibold">
                  Hookcut
                </th>
                <th scope="col" className="py-3 font-semibold text-muted">
                  {c.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((r) => (
                <tr key={r.label} className="border-b border-line align-top">
                  <th scope="row" className="py-4 pr-4 font-medium text-ink-2">
                    {r.label}
                  </th>
                  <td className="py-4 pr-4 font-semibold text-ink">{r.hookcut}</td>
                  <td className="py-4 text-ink-2">
                    {r.them}
                    {r.price && <span className="mt-1 block text-xs font-semibold text-cobalt-deep">{PRICE_NOTE}</span>}
                    {r.source && (
                      <span className="mt-1 block text-xs text-muted">
                        Source:{" "}
                        <a href={r.source.url} rel="nofollow noopener" target="_blank" className="underline decoration-line underline-offset-2 hover:text-cobalt">
                          {r.source.label}
                        </a>
                        , checked {CHECKED}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-2" aria-label="Which to choose">
        <div className="rounded-3xl bg-paper-2 p-7">
          <h2 className="font-display text-xl font-extrabold">When {c.name} is the better choice</h2>
          <ul className="mt-4 space-y-3 text-ink-2">
            {c.theyFit.map((t) => (
              <li key={t} className="flex gap-3">
                <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2" />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border-2 border-ink bg-white p-7">
          <h2 className="font-display text-xl font-extrabold">When Hookcut fits better</h2>
          <ul className="mt-4 space-y-3">
            {c.weFit.map((t) => (
              <li key={t} className="flex gap-3">
                <svg viewBox="0 0 20 20" className="mt-1 h-4 w-4 shrink-0" aria-hidden="true">
                  <path d="M4 10.5l4 4 8-9" fill="none" stroke="#2433d6" strokeWidth="2.6" strokeLinecap="round" />
                </svg>
                {t}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14 max-w-3xl" aria-labelledby="faq-h">
        <h2 id="faq-h" className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Questions
        </h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {c.faq.map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {q}
                <span className="text-2xl leading-none text-cobalt transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-3xl bg-mark px-8 py-10">
        <h2 className="font-display text-2xl font-black tracking-tight text-ink sm:text-3xl">Test it on your own video</h2>
        <p className="mt-2 max-w-xl text-ink-2">
          The quickest way to compare clippers is to run the same long video through both and look at the picks. Hookcut needs no
          account, so you can start in under a minute.
        </p>
        <Link prefetch={false} href="/app" className="mt-5 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-cobalt-deep">
          Open the studio
        </Link>
      </section>

      <nav aria-label="Other comparisons" className="mt-10 text-sm text-muted">
        Other comparisons:{" "}
        {others.map((o, i) => (
          <span key={o.slug}>
            {i > 0 && ", "}
            <Link href={`/vs/${o.slug}`} className="underline underline-offset-2 hover:text-cobalt">
              Hookcut vs {o.name}
            </Link>
          </span>
        ))}
        . {c.name} is a trademark of its owner; Hookcut is not affiliated with it.
      </nav>
    </div>
  );
}

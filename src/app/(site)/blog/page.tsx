import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides on finding great clips, writing hooks and making captions that work.",
  alternates: { canonical: "/blog" },
};

function fmt(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight">Blog</h1>
      <p className="mt-3 text-lg text-ink-2">Practical guides for people who clip long videos.</p>
      <ul className="mt-10 divide-y divide-line border-y border-line">
        {POSTS.map((p) => (
          <li key={p.slug} className="py-7">
            <Link href={`/blog/${p.slug}`} className="group block">
              <h2 className="font-display text-2xl font-extrabold tracking-tight group-hover:text-cobalt">
                {p.title}
              </h2>
              <p className="mt-2 text-ink-2">{p.description}</p>
              <p className="mt-2 text-sm text-muted">
                <time dateTime={p.date}>{fmt(p.date)}</time>, {p.readMins} minute read
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

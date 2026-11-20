import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS, getPost } from "@/lib/blog";
import { SITE } from "@/lib/site";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { type: "article", title: post.title, description: post.description, publishedTime: post.date },
  };
}

export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { "@type": "Organization", name: "Hookcut" },
    publisher: { "@type": "Organization", name: "Hookcut" },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  };
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <Link href="/blog" className="text-sm text-muted hover:text-cobalt">
        All articles
      </Link>
      <h1 className="font-display mt-4 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
        {post.title}
      </h1>
      <p className="mt-4 text-sm text-muted">
        <time dateTime={post.date}>{post.date}</time>, {post.readMins} minute read
      </p>
      <div className="prose-hc mt-8 text-[1.075rem] leading-[1.75] text-ink-2">{post.body}</div>
    </article>
  );
}

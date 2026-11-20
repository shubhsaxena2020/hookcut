import { getPost } from "@/lib/blog";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "A Hookcut blog post";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  return ogCard({
    kicker: "Blog",
    title: post?.title ?? "Hookcut blog",
    footer: post ? `${post.readMins} minute read · hookcut` : "AI clipping that runs in your browser",
  });
}

import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/app", "/pricing", "/blog", "/changelog", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: "2026-11-20",
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p === "/app" ? 0.9 : 0.6,
    })),
    ...POSTS.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

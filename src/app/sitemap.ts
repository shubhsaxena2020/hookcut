import type { MetadataRoute } from "next";
import { POSTS } from "@/lib/blog";
import { SITE } from "@/lib/site";
import { CHECKED, COMPETITORS } from "@/lib/compare";
import { USE_CASES } from "@/lib/usecases";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/app", "/pricing", "/blog", "/changelog", "/privacy", "/terms"];
  return [
    ...pages.map((p) => ({
      url: `${SITE.url}${p}`,
      lastModified: "2026-11-21",
      changeFrequency: "weekly" as const,
      priority: p === "" ? 1 : p === "/app" ? 0.9 : 0.6,
    })),
    ...USE_CASES.map((u) => ({
      url: `${SITE.url}/${u.slug}`,
      lastModified: "2026-11-21",
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...COMPETITORS.map((c) => ({
      url: `${SITE.url}/vs/${c.slug}`,
      lastModified: CHECKED,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...POSTS.map((p) => ({
      url: `${SITE.url}/blog/${p.slug}`,
      lastModified: p.date,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}

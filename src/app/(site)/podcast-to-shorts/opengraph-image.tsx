import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Hookcut: podcast episodes to captioned Shorts";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    kicker: "Podcast to Shorts",
    title: "One episode in. A week of Shorts out.",
    footer: "Unreleased episodes never leave your computer",
  });
}

import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Hookcut: Twitch VODs to TikToks with a stacked facecam";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    kicker: "Twitch to TikTok",
    title: "Gameplay below, your facecam on top. Every clip.",
    footer: "Free, in your browser, no upload, no watermark",
  });
}

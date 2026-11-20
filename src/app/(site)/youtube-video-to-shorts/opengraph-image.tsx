import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Hookcut: long YouTube videos to Shorts";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    kicker: "YouTube to Shorts",
    title: "Your back catalogue is full of Shorts.",
    footer: "Free AI clipping in your browser, no watermark",
  });
}

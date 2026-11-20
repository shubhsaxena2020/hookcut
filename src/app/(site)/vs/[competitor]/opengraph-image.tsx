import { getCompetitor } from "@/lib/compare";
import { OG_SIZE, ogCard } from "@/lib/og";

export const alt = "Hookcut compared with a cloud AI clipper";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ competitor: string }> }) {
  const { competitor } = await params;
  const c = getCompetitor(competitor);
  return ogCard({
    kicker: `vs ${c?.name ?? "cloud clippers"}`,
    title: "Free AI clips. No upload, no credits, no watermark.",
    footer: "A fair comparison, with a source for every claim",
  });
}

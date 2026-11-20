import type { Metadata } from "next";
import { StudioRoot } from "@/components/studio/StudioRoot";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Drop a long video and get captioned, reframed vertical clips. Everything runs in your browser.",
  alternates: { canonical: "/app" },
};

export default function StudioPage() {
  return <StudioRoot />;
}

import type { Metadata, Viewport } from "next";
import { Anybody, Instrument_Sans } from "next/font/google";
import { SITE } from "@/lib/site";
import "./globals.css";

const display = Anybody({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

const body = Instrument_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Hookcut: AI clipping that runs in your browser",
    template: "%s | Hookcut",
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: [
    "AI clipping",
    "video to shorts",
    "auto captions",
    "reframe to vertical",
    "podcast clips",
    "stream clips",
    "TikTok clips",
    "YouTube Shorts maker",
  ],
  openGraph: {
    type: "website",
    siteName: SITE.name,
    url: SITE.url,
    title: "Hookcut: AI clipping that runs in your browser",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Hookcut: AI clipping that runs in your browser",
    description: SITE.description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#2433d6",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}

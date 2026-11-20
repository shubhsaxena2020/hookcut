import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for using Hookcut.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <article className="prose-hc mx-auto px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight">Terms of use</h1>
      <p className="text-muted">Last updated 20 November 2026</p>
      <h2>Using Hookcut</h2>
      <p>
        Hookcut is a free browser tool for making short clips from videos. You may use it for personal
        and commercial projects. By using it you agree to these terms.
      </p>
      <h2>Your content</h2>
      <p>
        You keep all rights to the videos you open and the clips you make. Because processing happens
        on your device, we do not receive or store your videos. You are responsible for having the
        rights to the material you edit and publish, including music and third-party footage.
      </p>
      <h2>Acceptable use</h2>
      <ul>
        <li>Do not use the optional AI re-rank endpoint to send content that is unlawful.</li>
        <li>Do not attempt to overload, scrape or bypass the rate limits of our endpoints.</li>
        <li>Do not use Hookcut to infringe someone else&apos;s copyright or privacy.</li>
      </ul>
      <h2>No warranty</h2>
      <p>
        Hookcut is provided as is. Automatic transcription, clip scores and AI suggestions can be
        wrong; review your clips before you publish them. To the extent the law allows, we are not
        liable for lost data or indirect damages. Keep your original files: browser storage can be
        cleared by your browser.
      </p>
      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows the latest version. If paid plans are
        introduced later, they will come with their own clear terms before you can buy anything.
      </p>
      <h2>Contact</h2>
      <p>
        <a href="mailto:hello@hookcut.app">hello@hookcut.app</a>
      </p>
    </article>
  );
}

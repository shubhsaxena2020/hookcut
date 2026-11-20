import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Hookcut handles your data: your video never leaves your device.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <article className="prose-hc mx-auto px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-black tracking-tight">Privacy</h1>
      <p className="text-muted">Last updated 21 November 2026</p>
      <p>
        Hookcut is designed so that we never receive your video. This page explains exactly what
        happens to your data.
      </p>
      <h2>Your video and audio</h2>
      <p>
        When you open a file in the studio, your browser reads it locally. Decoding, transcription,
        face detection, scoring, caption rendering and encoding all run on your own device using
        WebCodecs, WebGPU and WebAssembly. Video and audio are never uploaded to Hookcut or to anyone
        else.
      </p>
      <h2>Projects</h2>
      <p>
        Projects, transcripts, clip settings and your brand kit are stored in your browser&apos;s
        IndexedDB and localStorage. They stay on this device and this browser profile. You can delete
        a project from the studio, or clear all of it by clearing this site&apos;s data in your browser
        settings.
      </p>
      <h2>Optional AI re-ranking</h2>
      <p>
        If you switch on AI titles and re-ranking, Hookcut sends the transcript text of your candidate
        clips (no audio, no video, no file names) to our <code>/api/rank</code> endpoint, which passes
        it to a language model through the Vercel AI Gateway and returns titles and scores. We do not
        store the text. The model provider processes it under its own API terms, which do not allow
        training on API data. If you leave the switch off, nothing about your content leaves your
        device.
      </p>
      <h2>Downloads from the internet</h2>
      <p>
        To run, the studio downloads the speech recognition model from Hugging Face and the face
        detection model and runtime files from Google and jsDelivr. These are ordinary file downloads;
        none of your content is sent with them. They are cached by your browser.
      </p>
      <h2>Analytics and cookies</h2>
      <p>
        Hookcut does not use advertising cookies or tracking pixels. Our host, Vercel, keeps standard
        server logs (such as IP address and requested page) for security and abuse prevention. The AI
        re-rank endpoint keeps a short in-memory counter per IP address to enforce its rate limit.
      </p>
      <p>
        We use Vercel Web Analytics to count page views. It does not use cookies, and it reports the
        page address, the referring site and coarse device information. Before a page view is sent,
        we remove everything from the address except a <code>ref</code> code and campaign tags. If we
        later turn on studio event counts (for example &ldquo;a clip was exported&rdquo;), they will
        only carry coarse buckets such as layout, frame rate or video length range, never file names,
        transcripts, titles or anything from your video.
      </p>
      <h2>End card and referral code</h2>
      <p>
        The &ldquo;Made with Hookcut&rdquo; end card is off by default. If you turn it on and choose
        to include a referral code, the code is a random string made in your browser and stored only
        there. It is not linked to you or to any account. When someone visits a link with that code,
        the code appears in our page view counts and nowhere else.
      </p>
      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href="mailto:hello@hookcut.app">hello@hookcut.app</a>.
      </p>
    </article>
  );
}

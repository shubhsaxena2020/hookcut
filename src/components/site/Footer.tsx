import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-paper">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted">
            Clips are cut on your own device. Your video never leaves it.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["/app", "Studio"],
            ["/pricing", "Pricing"],
            ["/changelog", "Changelog"],
          ]}
        />
        <FooterCol
          title="Use cases"
          links={[
            ["/twitch-clip-to-tiktok", "Twitch to TikTok"],
            ["/podcast-to-shorts", "Podcast to Shorts"],
            ["/youtube-video-to-shorts", "YouTube to Shorts"],
          ]}
        />
        <FooterCol
          title="Compare"
          links={[
            ["/vs/opus-clip", "vs Opus Clip"],
            ["/vs/vizard", "vs Vizard"],
            ["/vs/klap", "vs Klap"],
            ["/vs/submagic", "vs Submagic"],
          ]}
        />
        <FooterCol
          title="Learn"
          links={[
            ["/blog", "Blog"],
            ["/blog/find-best-moments-in-a-long-stream", "Clipping a long stream"],
            ["/blog/captions-that-stay-in-sync", "Captions that stay in sync"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
          ]}
        />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-muted sm:px-6">
        Hookcut is an independent product, not affiliated with any tool it is compared with. Comparisons
        are based on public pricing pages as of November 2026 and link to their sources.
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm text-muted">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} prefetch={href === "/app" ? false : undefined} className="hover:text-cobalt">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

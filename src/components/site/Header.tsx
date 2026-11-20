import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/#how", label: "How it works" },
  { href: "/#compare", label: "Compare" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-paper">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="Hookcut home" className="shrink-0">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-7 text-[0.95rem] text-ink-2 md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-cobalt">
              {n.label}
            </Link>
          ))}
        </nav>
        <Link
          prefetch={false}
          href="/app"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper transition-colors hover:bg-cobalt"
        >
          Open the studio
        </Link>
      </div>
    </header>
  );
}

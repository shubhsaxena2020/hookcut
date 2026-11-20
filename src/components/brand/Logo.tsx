type Props = { className?: string; size?: number; tone?: "light" | "dark" };

/** Hookcut mark: a hook drawn as one stroke, with a clean diagonal cut through the stem. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="#2433d6" />
      <path
        d="M19.5 6.5v12.2a6 6 0 0 1-12 0v-1.4"
        fill="none"
        stroke="#ffe14a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d="M14.5 13.2l10-3.6" stroke="#2433d6" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, size = 28, tone = "light" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark size={size} />
      <span
        className="font-display font-extrabold tracking-tight"
        style={{
          fontSize: size * 0.78,
          color: tone === "light" ? "var(--ink)" : "var(--night-text)",
          lineHeight: 1,
        }}
      >
        hookcut
      </span>
    </span>
  );
}

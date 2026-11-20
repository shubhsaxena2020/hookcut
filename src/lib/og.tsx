import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared Open Graph card for the landing pages: kicker, headline, footer line. */
export function ogCard({ kicker, title, footer }: { kicker: string; title: string; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#2433d6",
          color: "white",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#11133a" />
            <path
              d="M19.5 6.5v12.2a6 6 0 0 1-12 0v-1.4"
              fill="none"
              stroke="#ffe14a"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path d="M14.5 13.2l10-3.6" stroke="#11133a" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>hookcut</div>
          <div
            style={{
              marginLeft: 16,
              padding: "6px 16px",
              borderRadius: 999,
              background: "#ffe14a",
              color: "#11133a",
              fontSize: 28,
              fontWeight: 800,
            }}
          >
            {kicker}
          </div>
        </div>
        <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "rgba(255,255,255,0.85)" }}>{footer}</div>
      </div>
    ),
    OG_SIZE,
  );
}

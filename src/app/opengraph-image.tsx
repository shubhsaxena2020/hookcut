import { ImageResponse } from "next/og";

export const alt = "Hookcut: AI clipping that runs in your browser";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  const words = ["no", "upload,", "no", "credits,", "no", "watermark"];
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
          <svg width="72" height="72" viewBox="0 0 32 32">
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
          <div style={{ fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>hookcut</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            Long video in. Shorts that hook, out.
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 36, fontSize: 40, fontWeight: 800 }}>
            {words.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: "2px 12px",
                  borderRadius: 8,
                  background: i === 3 ? "#ffe14a" : "transparent",
                  color: i === 3 ? "#11133a" : "white",
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}

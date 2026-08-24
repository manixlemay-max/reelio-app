import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(10,10,10,0) 70%)",
            top: -150,
            left: 250,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="90" height="90" viewBox="0 0 24 24" fill="none">
            <defs>
              <linearGradient id="g" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="55%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#d946ef" />
              </linearGradient>
            </defs>
            <path
              d="M6 20V4h7a4 4 0 0 1 0 8H6M13 12l6 8"
              stroke="url(#g)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="4" r="1.3" fill="url(#g)" />
            <circle cx="19" cy="20" r="1.3" fill="url(#g)" />
          </svg>
          <div style={{ fontSize: 84, fontWeight: 600, color: "#ededed", display: "flex" }}>Reelio</div>
        </div>
        <div style={{ fontSize: 32, color: "#a3a3a3", marginTop: 28, display: "flex" }}>
          AI UGC videos for e-commerce — done for you
        </div>
      </div>
    ),
    size
  );
}

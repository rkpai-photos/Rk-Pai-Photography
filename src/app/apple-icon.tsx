// 180×180 PNG served at /apple-icon — used by iOS Add-to-Homescreen, and by
// Android Chrome when no maskable icon is provided. Same visual language as
// /icon, scaled up with a hairline red-orange accent so the brand reads at
// homescreen size.

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1917", // stone-900
          color: "#fafaf9", // stone-50
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        <div
          style={{
            fontWeight: 800,
            fontSize: 78,
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          RK
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#a8a29e", // stone-400
            fontFamily: "system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          PAI
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 26,
            width: 36,
            height: 2,
            background: "#FF3F34", // red-orange-500
          }}
        />
      </div>
    ),
    size,
  );
}

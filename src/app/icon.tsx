// Dynamically-generated 32×32 favicon, served at /icon. Replaces the previous
// fall-through to /favicon.ico for the in-browser tab favicon (the .ico file
// stays in /public as a safety net for legacy clients).
// See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1917", // stone-900
          color: "#fafaf9", // stone-50
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, serif",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        rk
      </div>
    ),
    size,
  );
}

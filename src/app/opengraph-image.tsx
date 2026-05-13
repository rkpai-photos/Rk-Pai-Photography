// Default Open Graph image, served at /opengraph-image (1200×630 PNG). Next
// auto-references this from the root layout's `metadata.openGraph.images` —
// any page that doesn't override OG inherits this as its social-preview card.
// /stories/[id] DOES override (with the photo itself — see that route's own
// opengraph-image.tsx).
//
// Visual: stone-200 field, Playfair-ish display serif "RK PAI" (Playfair isn't
// shipped to the OG generator — we'd need to bundle the woff2 — so Georgia
// fallback is in use, which reads as the same family. Bumped weight + tracking
// to compensate). "PHOTOGRAPHY" caption under, red-orange hairline divider.

import { ImageResponse } from "next/og";
import { defaultTitle } from "@/lib/site";

export const alt = defaultTitle;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#e7e5e4", // stone-200
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Georgia, 'Times New Roman', serif",
          position: "relative",
        }}
      >
        <div
          style={{
            fontSize: 200,
            fontWeight: 800,
            color: "#1c1917", // stone-900
            letterSpacing: "0.02em",
            lineHeight: 1,
          }}
        >
          RK PAI
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 36,
            color: "#57534e", // stone-600
            letterSpacing: "0.4em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 300,
          }}
        >
          Photography
        </div>
        <div
          style={{
            marginTop: 48,
            width: 280,
            height: 3,
            background: "#FF3F34", // red-orange-500
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 36,
            fontSize: 22,
            color: "#78716c", // stone-500
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 400,
          }}
        >
          rkpai.in
        </div>
      </div>
    ),
    size,
  );
}

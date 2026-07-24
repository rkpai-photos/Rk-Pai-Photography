// Per-photo dynamic Open Graph image (1200×630 PNG) for /stories/[id]. Next
// auto-wires this into the page's social-preview metadata — so when someone
// shares a story URL on Facebook/Instagram/WhatsApp/etc., the preview card
// shows THAT photograph (with a small brand watermark), not a generic site
// image. This is the single biggest social-sharing win for a photo site.
//
// Falls back to a stone-900 panel with the brand wordmark if the photo can't
// be fetched (deleted slug, Convex down, etc.) — never breaks the social card.

import { ImageResponse } from "next/og";

import { fetchPhotoBySlug } from "@/lib/photo";
import { siteName } from "@/lib/site";

export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function PhotoOpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await fetchPhotoBySlug(id).catch(() => null);

  // Fallback when the photo can't be found — render the brand panel.
  if (!photo || !photo.image_url) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#1c1917",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            color: "#fafaf9",
            fontSize: 180,
            fontWeight: 800,
            letterSpacing: "0.02em",
          }}
        >
          RK PAI
        </div>
      ),
      size,
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#1c1917",
          display: "flex",
          position: "relative",
        }}
      >
        {/* The photograph — Satori (next/og's renderer) fetches the remote
            Convex storage URL at request time. */}
        <img
          src={photo.image_url}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        {/* Gradient + brand strip across the bottom so the photo carries the
            visual weight but it's still recognisably "from rkpai.in". */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 200,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85), rgba(0,0,0,0.25) 70%, rgba(0,0,0,0))",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
            padding: "40px 56px",
            color: "#fafaf9",
          }}
        >
          {photo.alt ? (
            <div
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 52,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "0.005em",
                // Two-line clamp via max-height + line-clamp emulation: Satori
                // doesn't support line-clamp natively, so we just trust short
                // alt-texts (which they are — photo names).
              }}
            >
              {photo.alt}
            </div>
          ) : null}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: "system-ui, sans-serif",
              fontSize: 22,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#d6d3d1", // stone-300
              fontWeight: 400,
            }}
          >
            <span
              style={{
                width: 12,
                height: 2,
                background: "#FF3F34",
              }}
            />
            RK Pai · Photography
          </div>
        </div>
      </div>
    ),
    size,
  );
}

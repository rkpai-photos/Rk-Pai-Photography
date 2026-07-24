// Served at /manifest.webmanifest. Modest PWA-ish metadata so Add-to-Homescreen
// uses our branding instead of a screenshot.
// See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest

import type { MetadataRoute } from "next";
import { defaultDescription, siteName } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: "RK Pai",
    description: defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#e7e5e4", // stone-200 — matches the body
    theme_color: "#1c1917", // stone-900 — matches the top of the curtain loader
    icons: [
      // Static PNGs upscaled from /public/favicon.ico via ffmpeg (Lanczos from
      // the 48×48 frame). 192/512 are the PWA-manifest standard sizes; the
      // Apple touch icon is auto-wired from src/app/apple-icon.png by Next.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}

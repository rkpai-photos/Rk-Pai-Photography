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
      // These point at the dynamic icon routes (src/app/icon.tsx, apple-icon.tsx).
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

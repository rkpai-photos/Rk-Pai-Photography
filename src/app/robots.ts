// Served at /robots.txt — tells crawlers where they can/can't go and points
// at the sitemap. See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots

import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // The /admin dashboard is already gated by Convex Auth, but block it
        // from crawlers too (defence in depth + don't waste crawl budget).
        // /api/auth/* is the Convex Auth proxy — also off-limits.
        disallow: ["/admin", "/admin/", "/api/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

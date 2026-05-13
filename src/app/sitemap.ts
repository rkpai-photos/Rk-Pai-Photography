// Served at /sitemap.xml. Lists the public static routes plus one entry per
// photo in Convex, each with the image URL inside `images:[…]` — Google reads
// that field and pulls the photos into Image Search results, which is the
// single biggest organic-discovery lever for a photography portfolio.
//
// See https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
//
// `force-dynamic` is required because `fetchPhotos` → `fetchQuery` from
// `convex/nextjs` uses `revalidate: 0` (Convex data is always live). Without
// this, Next tries to statically pre-render the sitemap at build time and
// throws DYNAMIC_SERVER_USAGE — fetchPhotos's try/catch then swallows the
// error and returns [], so the build "succeeds" but the sitemap ships with
// zero photo URLs. Setting the route to force-dynamic moves rendering to
// request-time, which is fine for a sitemap (search bots fetch it a few
// times a day, not on the hot path).

import type { MetadataRoute } from "next";

import { fetchPhotos } from "@/lib/photo";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const photos = await fetchPhotos();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: absoluteUrl("/stories"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/album"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const photoRoutes: MetadataRoute.Sitemap = photos
    .filter((p) => p.id && p.image_url)
    .map((p) => ({
      url: absoluteUrl(`/stories/${p.id}`),
      lastModified: p.createdAt ? new Date(p.createdAt) : now,
      changeFrequency: "yearly" as const,
      priority: 0.8,
      images: [p.image_url],
    }));

  return [...staticRoutes, ...photoRoutes];
}

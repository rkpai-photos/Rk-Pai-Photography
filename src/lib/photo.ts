// @ts-nocheck
//
// Photo data layer. Backed by Convex (the `photos` table — see convex/schema.ts).
// Replaced the old Google Sheets reader. The returned shape is intentionally the
// same `Photo` object the components already consume (id / src / image_url /
// width / height / story / createdAt / created_at / imageType / image_type),
// so nothing downstream had to change.
//
// NOTE: `api` comes from convex/_generated/, which only exists after you've run
// `npx convex dev` once. Run that before `next build` / `next dev`.
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";

export interface Photo {
  id: string;
  alt: string;
  width: number;
  height: number;
  story: string;
  created_at: string;
  image_type: string;
  image_url: string;
  // synthesized convenience fields used by components
  src: string;
  createdAt: string;
  imageType: string;
  location?: string;
  // LQIP for next/image's blur placeholder (undefined for legacy rows).
  blurDataURL?: string;
}

function toPhoto(row: any): Photo {
  const url = row.imageUrl ?? "";
  return {
    id: row.slug ?? "",
    src: url,
    image_url: url,
    alt: row.alt ?? "",
    width: row.width || 300,
    height: row.height || 200,
    story: row.story ?? "",
    createdAt: row.createdAt ?? new Date().toISOString(),
    created_at: row.createdAt ?? "",
    imageType: row.imageType ?? "jpeg",
    image_type: row.imageType ?? "jpeg",
    location: row.location,
    blurDataURL: row.blurDataURL,
  };
}

export async function fetchPhotos(): Promise<Photo[]> {
  try {
    const rows = (await fetchQuery(api.photos.list, {})) ?? [];
    const photos = rows.map(toPhoto);
    console.log(`Total photos fetched from Convex: ${photos.length}`);
    return photos;
  } catch (error) {
    console.error("Error fetching photos from Convex:", error);
    return [];
  }
}

export async function fetchPhotoBySlug(slug: string): Promise<Photo | null> {
  try {
    const row = await fetchQuery(api.photos.getBySlug, { slug });
    return row ? toPhoto(row) : null;
  } catch (error) {
    console.error("Error fetching photo from Convex:", error);
    return null;
  }
}

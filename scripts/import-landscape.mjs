// One-off bulk import of public/landscape/*.jpeg into the Convex `photos` table,
// appended after the existing (bird) photos so they land at the end of /stories.
//
// Prerequisites:
//   1. convex/bulkImport.ts deployed   (npx convex dev / npx convex dev --once)
//   2. IMPORT_SECRET set on the deployment AND in this process's env:
//        npx convex env set IMPORT_SECRET "<secret>"
//        IMPORT_SECRET="<secret>" node scripts/import-landscape.mjs
//
// For each source JPEG it: optimizes to <=2000px WebP q82 (ImageMagick),
// generates a tiny blur placeholder, uploads the blob to Convex storage, and
// inserts a row. Re-runnable — createForImport skips slugs that already exist.

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC_DIR = join(ROOT, "public", "landscape");

const SECRET = process.env.IMPORT_SECRET;
if (!SECRET) {
  console.error(
    "IMPORT_SECRET is required. Run:\n" +
      '  npx convex env set IMPORT_SECRET "<secret>"\n' +
      '  IMPORT_SECRET="<secret>" node scripts/import-landscape.mjs',
  );
  process.exit(1);
}

// Resolve the Convex URL from the environment, falling back to .env.local.
function convexUrl() {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) return process.env.NEXT_PUBLIC_CONVEX_URL;
  const envFile = join(ROOT, ".env.local");
  if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, "utf8").split("\n")) {
      const m = line.match(/^\s*NEXT_PUBLIC_CONVEX_URL\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "");
    }
  }
  throw new Error("NEXT_PUBLIC_CONVEX_URL not found in env or .env.local");
}

// file -> public metadata. story "" / no location are intentional for the
// images location_info.txt left blank or unverified (flagged in the plan).
const PHOTOS = [
  { file: "l1.jpeg", slug: "new-delhi", alt: "New Delhi", location: "New Delhi, India", story: "A frame from the capital, New Delhi." },
  { file: "l2.jpeg", slug: "qutb-minar", alt: "Qutb Minar", location: "New Delhi, India", story: "The 73-metre Qutb Minar, the world's tallest brick minaret, begun in the 12th century." },
  { file: "l3.jpeg", slug: "gommateshwara-karkala", alt: "Gommateshwara, Karkala", location: "Karkala, Karnataka", story: "The 42-foot monolithic Gommateshwara (Bahubali) statue at Karkala, consecrated in 1432 AD." },
  { file: "l4.jpeg", slug: "qutb-minar-2", alt: "Qutb Minar", location: "New Delhi, India", story: "Detail of the Qutb Minar complex, New Delhi." },
  { file: "l5.jpeg", slug: "landscape-05", alt: "Untitled", location: "", story: "" },
  { file: "l6.jpeg", slug: "qutb-minar-3", alt: "Qutb Minar", location: "New Delhi, India", story: "The fluted red-sandstone shaft of the Qutb Minar." },
  { file: "l7.jpeg", slug: "landscape-07", alt: "Untitled", location: "", story: "" },
  { file: "l8.jpeg", slug: "taj-mahal", alt: "Taj Mahal", location: "Agra, India", story: "The 17th-century ivory-marble Taj Mahal on the Yamuna, Agra." },
  { file: "l9.jpeg", slug: "aerial-view", alt: "Aerial View", location: "", story: "A view from the sky." },
  { file: "l10.jpeg", slug: "qutb-minar-4", alt: "Qutb Minar", location: "New Delhi, India", story: "Looking up the Qutb Minar, New Delhi." },
  { file: "l11.jpeg", slug: "tiger-hill-darjeeling", alt: "Tiger Hill, Darjeeling", location: "Darjeeling, West Bengal", story: "Tiger Hill, famed for its sunrise over the Eastern Himalaya." },
  { file: "l12.jpeg", slug: "hawa-mahal", alt: "Hawa Mahal", location: "Jaipur, Rajasthan", story: 'The honeycomb facade of the Hawa Mahal, the "Palace of Winds", Jaipur.' },
  { file: "l13.jpeg", slug: "panchalingeshwara-vittal", alt: "Sri Panchalingeshwara Temple", location: "Vittal, Karnataka", story: "The Sri Panchalingeshwara temple at Vittal, Karnataka." },
  { file: "l14.jpeg", slug: "latpanchar", alt: "Latpanchar", location: "Latpanchar, West Bengal", story: "The hill hamlet of Latpanchar in the Mahananda range, West Bengal." },
  { file: "l15.jpeg", slug: "kodi-beach-kundapura", alt: "Kodi Beach", location: "Kundapura, Karnataka", story: "Where the Panchagangavalli meets the Arabian Sea at Kodi, near Kundapura." },
  { file: "l16.jpeg", slug: "madhukeshwara-banavasi", alt: "Madhukeshwara Temple, Banavasi", location: "Banavasi, Karnataka", story: "The Madhukeshwara temple at Banavasi, one of Karnataka's oldest temple towns." },
  { file: "l17.jpeg", slug: "dehradun", alt: "Dehradun", location: "Dehradun, Uttarakhand", story: "A view from Dehradun, in the Doon valley." },
  { file: "l18.jpeg", slug: "hungarian-parliament-budapest", alt: "Hungarian Parliament, Budapest", location: "Budapest, Hungary", story: "The neo-Gothic Hungarian Parliament on the Danube, Budapest." },
  { file: "l19.jpeg", slug: "st-stephens-cathedral-vienna", alt: "St. Stephen's Cathedral, Vienna", location: "Vienna, Austria", story: "Stephansdom, the Gothic landmark at the heart of Vienna." },
  { file: "l20.jpeg", slug: "st-stephens-cathedral-vienna-2", alt: "St. Stephen's Cathedral, Vienna", location: "Vienna, Austria", story: "Another view of Vienna's St. Stephen's Cathedral." },
  { file: "l21.jpeg", slug: "mysore-palace", alt: "Mysore Palace", location: "Mysuru, Karnataka", story: "The Indo-Saracenic Mysore Palace, seat of the Wadiyar dynasty." },
  { file: "l22.jpeg", slug: "mysore-palace-2", alt: "Mysore Palace", location: "Mysuru, Karnataka", story: "The illuminated domes and arches of Mysore Palace." },
  { file: "l23.jpeg", slug: "chamarajendra-wodeyar-statue", alt: "Chamarajendra Wodeyar Statue", location: "Mysuru, Karnataka", story: "The statue of Maharaja Chamarajendra Wadiyar at a Mysuru circle." },
  { file: "l24.jpeg", slug: "panchalingeshwara-vittal-2", alt: "Sri Panchalingeshwara Temple", location: "Vittal, Karnataka", story: "The temple grounds at Sri Panchalingeshwara, Vittal." },
  { file: "l25.jpeg", slug: "garden-chapel-goa", alt: "Garden Chapel, Goa", location: "Goa, India", story: "A green archway frames the 17th-century Garden Chapel ruin in the grounds of the Grand Hyatt, Goa." },
  { file: "l26.jpeg", slug: "mysore-palace-3", alt: "Mysore Palace", location: "Mysuru, Karnataka", story: "Mysore Palace, India." },
  { file: "l27.jpeg", slug: "club-mahindra-varca-goa", alt: "Club Mahindra, Varca", location: "Varca, Goa", story: "Resort grounds at Club Mahindra Varca, Goa." },
  { file: "l28.jpeg", slug: "panchalingeshwara-vittal-3", alt: "Sri Panchalingeshwara Temple", location: "Vittal, Karnataka", story: "Sri Panchalingeshwara temple, Vittal." },
  { file: "l29.jpeg", slug: "veerendra-heggade", alt: "Dr. Veerendra Heggade", location: "", story: "Dr. D. Veerendra Heggade, Dharmadhikari of Dharmasthala and Member of the Rajya Sabha." },
  { file: "l30.jpeg", slug: "sri-shekara-parava", alt: "Sri Shekara Parava", location: "", story: "" },
  { file: "l31.jpeg", slug: "vienna", alt: "Vienna", location: "Vienna, Austria", story: "A street view in Vienna, Austria." },
  { file: "l32.jpeg", slug: "panchalingeshwara-mundalthaya", alt: "Sri Panchalingeshwara Temple, Mundalthaya", location: "Mundalthaya, Vittal", story: "The Sri Panchalingeshwara temple at Mundalthaya, Vittal." },
];

const client = new ConvexHttpClient(convexUrl());
const tmp = mkdtempSync(join(tmpdir(), "rkpai-landscape-"));

function magick(args, opts = {}) {
  return execFileSync("magick", args, { maxBuffer: 64 * 1024 * 1024, ...opts });
}

async function importOne(p, n, total) {
  const src = join(SRC_DIR, p.file);
  if (!existsSync(src)) {
    console.warn(`[${n}/${total}] ${p.slug} — MISSING ${p.file}, skipped`);
    return;
  }

  // 1. Optimize: <=2000px long edge, WebP q82, EXIF rotation baked in, metadata stripped.
  const out = join(tmp, `${p.slug}.webp`);
  magick([src, "-auto-orient", "-resize", "2000x2000>", "-strip", "-quality", "82", "-define", "webp:method=6", out]);

  // 2. Dimensions of the optimized image (for the masonry layout / next/image).
  const [width, height] = magick(["identify", "-format", "%w %h", out])
    .toString()
    .trim()
    .split(/\s+/)
    .map((s) => parseInt(s, 10));

  // 3. Tiny blur placeholder (LQIP) as a JPEG data URL, like the admin form.
  const blurJpg = magick([out, "-resize", "16x", "-strip", "-quality", "50", "jpg:-"]);
  const blurDataURL = `data:image/jpeg;base64,${Buffer.from(blurJpg).toString("base64")}`;

  // 4. Upload the WebP blob to Convex storage.
  const uploadUrl = await client.mutation(anyApi.bulkImport.generateUploadUrlForImport, { secret: SECRET });
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/webp" },
    body: readFileSync(out),
  });
  if (!res.ok) throw new Error(`upload failed for ${p.file} (${res.status})`);
  const { storageId } = await res.json();

  // 5. Insert the row (order auto-appends after the existing photos).
  await client.mutation(anyApi.bulkImport.createForImport, {
    secret: SECRET,
    slug: p.slug,
    alt: p.alt,
    width,
    height,
    story: p.story ?? "",
    imageId: storageId,
    imageType: "webp",
    blurDataURL,
    ...(p.location ? { location: p.location } : {}),
  });
  console.log(`[${n}/${total}] ${p.slug} ✓  ${width}x${height}`);
}

let ok = 0;
try {
  for (let i = 0; i < PHOTOS.length; i++) {
    await importOne(PHOTOS[i], i + 1, PHOTOS.length);
    ok++;
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
console.log(`Done. ${ok}/${PHOTOS.length} processed.`);

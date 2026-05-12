// One-time import: Google Sheet -> Convex (`photos` table, images into File Storage).
//
// Prereqs (run these first):
//   1. npx convex dev          # provisions the deployment, generates convex/_generated, writes NEXT_PUBLIC_CONVEX_URL to .env.local
//   2. npx convex env set ADMIN_SECRET <some-strong-value>
//   3. add to .env.local:  ADMIN_SECRET=<same value>
//      and keep the existing Google vars: GOOGLE_APPLICATION_CREDENTIALS (base64 JSON), GOOGLE_SHEET_ID, [GOOGLE_SHEET_RANGE]
//
// Then:  npm run import:photos
//
// Safe to re-run: rows whose slug already exists in Convex are skipped.
// After it succeeds you can: npm uninstall googleapis && delete this script.

import { config as loadEnv } from "dotenv";
import { google } from "googleapis";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

loadEnv({ path: ".env.local" });
loadEnv(); // .env fallback

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SHEET_RANGE = process.env.GOOGLE_SHEET_RANGE || "Sheet1!A:H";
const GOOGLE_CREDS_B64 = process.env.GOOGLE_APPLICATION_CREDENTIALS;

function die(msg) {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

if (!CONVEX_URL) die("NEXT_PUBLIC_CONVEX_URL is not set — run `npx convex dev` first.");
if (!ADMIN_SECRET) die("ADMIN_SECRET is not set in .env.local (must match `npx convex env set ADMIN_SECRET ...`).");
if (!GOOGLE_CREDS_B64) die("GOOGLE_APPLICATION_CREDENTIALS (base64 service-account JSON) is not set.");
if (!SHEET_ID) die("GOOGLE_SHEET_ID is not set.");

async function readSheetRows() {
  const credentials = JSON.parse(Buffer.from(GOOGLE_CREDS_B64, "base64").toString("utf-8"));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth: await auth.getClient() });
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SHEET_ID, range: SHEET_RANGE });
  const rows = res.data.values || [];
  if (rows.length <= 1) return [];
  const headers = rows[0].map((h) => String(h).toLowerCase().trim());
  return rows.slice(1).map((row) => {
    const entry = {};
    headers.forEach((h, i) => (entry[h] = row[i] ?? ""));
    return entry;
  });
}

async function uploadImage(client, imageUrl) {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`fetch ${imageUrl} -> ${res.status}`);
  const contentType = res.headers.get("content-type") || "image/jpeg";
  const bytes = Buffer.from(await res.arrayBuffer());
  const uploadUrl = await client.mutation(api.photos.generateUploadUrl, { adminSecret: ADMIN_SECRET });
  const up = await fetch(uploadUrl, { method: "POST", headers: { "Content-Type": contentType }, body: bytes });
  if (!up.ok) throw new Error(`upload -> ${up.status}`);
  const { storageId } = await up.json();
  return { storageId, contentType };
}

async function main() {
  const client = new ConvexHttpClient(CONVEX_URL);
  const rows = await readSheetRows();
  if (rows.length === 0) die("Sheet returned no data rows.");

  console.log(`Found ${rows.length} rows. Importing into ${CONVEX_URL} …\n`);
  let imported = 0,
    skipped = 0,
    failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const slug = String(r.id || "").trim();
    const imageUrl = String(r.image_url || "").trim();
    if (!slug || !imageUrl) {
      console.warn(`  [${i}] skipped — missing id or image_url`);
      skipped++;
      continue;
    }
    try {
      const { storageId, contentType } = await uploadImage(client, imageUrl);
      await client.mutation(api.photos.create, {
        adminSecret: ADMIN_SECRET,
        slug,
        alt: String(r.alt || "").trim(),
        width: parseInt(r.width, 10) || 0,
        height: parseInt(r.height, 10) || 0,
        story: String(r.story || "").trim(),
        imageId: storageId,
        imageType: (String(r.image_type || "").trim() || contentType.split("/")[1] || "jpeg").toLowerCase(),
        location: String(r.location || "").trim() || undefined,
        createdAt: String(r.created_at || "").trim() || undefined,
        order: i,
      });
      imported++;
      console.log(`  [${i}] ✓ ${slug}`);
    } catch (err) {
      const msg = String(err?.message || err);
      if (msg.includes("already exists")) {
        skipped++;
        console.log(`  [${i}] – ${slug} (already exists)`);
      } else {
        failed++;
        console.error(`  [${i}] ✗ ${slug}: ${msg}`);
      }
    }
  }

  console.log(`\nDone. imported=${imported} skipped=${skipped} failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((e) => die(String(e?.stack || e)));

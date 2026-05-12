# RK Pai Photography — Codebase Context

> Persistent reference for Claude Code sessions. Read this first to orient before exploring.

## 0. Working style (applies every session)

- **Ask before you code when the ask is vague.** If the request is ambiguous, under-scoped, or could be read multiple ways, ask one focused clarifying question first. Guessing and redoing costs more than a round-trip.
- **Commit after every major change.** After a meaningful feature, refactor, schema/data-source change, or any non-trivial fix, make a git commit with a clear message. Don't leave large changes uncommitted across sessions.
- **Append a chat summary to this file.** After a substantial change or a notable session, add a concise entry to the **Conversation Log** (section 11) — what changed, why, and anything a future session would otherwise have to re-derive from code alone. Keep trivial fixes out of it.
- **Never delete this file.** `CONTEXT.md` is the project's persistent memory. Update by appending; if it gets corrupted, restore from the last good version in git history.

## 1. Project Purpose

**RK Pai Photography** is a marketing/portfolio website for a wildlife photographer (RK Pai). It showcases bird & wildlife photography with story-driven detail pages and an interactive 3D photo-book "album". The photo set lives in a **Convex** database (table `photos`), with image files in **Convex File Storage**. There's a lightweight `/admin` dashboard for adding/editing/deleting photos. *(Migrated off Google Sheets — see §11.)*

Single Next.js app, public-facing. No user auth; `/admin` is gated by a shared secret.

## 2. Tech Stack

- **Framework:** Next.js `14.2.18` (App Router), React 18, TypeScript 5
- **Styling:** TailwindCSS 3.4 + `tailwindcss-animate`; shadcn/ui scaffolding (`components.json`, CSS variables in [src/app/globals.css](src/app/globals.css)); `clsx` + `tailwind-merge` via `cn()` in [src/lib/utils.ts](src/lib/utils.ts)
- **Animation:** Framer Motion / `motion`, GSAP `3.12` + `ScrollTrigger`, `split-type`
- **3D:** React Three Fiber `8` + `@react-three/drei` `9` + `maath` + `three` — used only by the `/album` flipbook
- **State:** Jotai (`pageAtom` driving the 3D book; not used elsewhere)
- **Gallery layout:** `react-masonry-css`
- **Data:** **Convex** (`convex` ^1.38) — `photos` table + File Storage; reads via `convex/nextjs` `fetchQuery` in server components, `convex/react` `useQuery`/`useMutation` in the `/admin` client page. See §5.
- **Icons:** `lucide-react` &nbsp;|&nbsp; **Fonts:** Archivo via `next/font/google` (`--font-archivo`, the Tailwind `sans` family) + Poppins imported via Google Fonts CSS in `globals.css`
- **Lint/format:** ESLint (`next/core-web-vitals` + `next/typescript`), Prettier (`tabWidth: 2`)
- **`googleapis`** is now a **devDependency**, used only by the one-time import script (`scripts/import-from-sheet.mjs`). Once the import has been run in production it (and the script) can be removed.
- **Vestigial deps — present in `package.json`, NOT used in `src/`:** `@prisma/client`, `prisma`, `aws-sdk`, `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`, `dotenv` (`dotenv` *is* used by `scripts/import-from-sheet.mjs`), `lodash` (used in `UI.jsx` for `debounce`). Leftovers from an earlier DynamoDB/Prisma approach. Don't build on them; remove them if you ever clean up dependencies.

## 3. Commands

Use **pnpm** for installation and other checks.

```bash
pnpm install                 # install deps (run `pnpm approve-builds` once for esbuild/prisma postinstall scripts)
pnpm run convex              # `convex dev` — provisions/syncs the Convex backend, generates convex/_generated, writes NEXT_PUBLIC_CONVEX_URL to .env.local. Run this first, keep it running in dev.
pnpm run dev                 # Next.js dev server — http://localhost:3000  (run in a second terminal)
pnpm run build               # production build  (needs convex/_generated to exist — i.e. `pnpm run convex` has run at least once)
pnpm run start               # serve the production build
pnpm run lint                # next lint (ESLint)
pnpm run import:photos       # one-time Google Sheet -> Convex import (see §5 / scripts/import-from-sheet.mjs)
```

No test suite exists. Both `package-lock.json` and `pnpm-lock.yaml` are present (the pnpm lockfile was untracked); prefer pnpm and don't commit a second lockfile without reason.

## 4. Directory Layout

```
convex/                Convex backend
  schema.ts            `photos` table (slug, alt, width, height, story, imageId -> _storage, imageType, location?, createdAt, order) + by_slug / by_order indexes
  photos.ts            queries: list, getBySlug, verifyAdmin · mutations (admin-secret gated): generateUploadUrl, create, update, remove, reorder
  tsconfig.json        Convex-functions tsconfig
  _generated/          (created by `pnpm run convex` — committed once it exists; the app imports `api`/`dataModel` from here)
scripts/
  import-from-sheet.mjs  one-time: read the old Google Sheet -> upload images to Convex storage -> insert `photos` rows. Re-runnable (skips existing slugs).
src/
  app/                 Next.js App Router
    layout.tsx         Root layout — Archivo font, <body> = bg-stone-200 / text-stone-900; wraps children in <ConvexClientProvider>
    globals.css        Tailwind layers + shadcn CSS vars + Poppins import + .fade-to-transparent util
    page.tsx           "/"  landing page (server component, force-dynamic)
    admin/
      layout.tsx       robots:noindex metadata for the /admin route
      page.tsx         "/admin" — photo CRUD dashboard (client; secret gate -> list/add/edit/delete; uploads to Convex storage)
    stories/
      page.tsx         "/stories" — masonry gallery of all photos (force-dynamic)
      [id]/
        page.tsx         "/stories/[id]" — photo detail; generateMetadata; uses TypeWriter + PhotoClinet
        PhotoClinet.tsx  client child (note the typo'd filename — referenced as-is)
        TypeWriter.tsx   client typewriter heading
    album/
      page.jsx         "/album" — R3F <Canvas> mounting <Experience/> + <UI/> overlay; "use client"
  sections/            Page-section components composed by routes
    Header.tsx         Main site nav (About / Gallery / Albums / Recent Stories / Contact mailto)
    Nav.tsx            Minimal nav (logo + home button) used on /stories
    Hero.tsx           Landing hero — GSAP scroll-scrub image zoom + WordPullUp
    About.tsx          About section — animated decorative SVG + photo
    SlideShow.tsx      Landing "PortfolioGrid" — MorphingText + a hard-coded grid of /images/birdN.jpg
    Projects.tsx       "My Recent Stories" — list of photos linking to /stories/[id]
    Footer.tsx         Footer with Framer Motion text-reveal
    Testimonials.tsx   NOT currently mounted anywhere (stale placeholder content)
  components/
    Book.jsx           R3F skinned-mesh page-turning book (geometry, bones, page textures from /public/textures)
    Experience.jsx     R3F scene — <Book/> in a <Float>, OrbitControls, lights, shadow plane
    UI.jsx             Book page-navigation buttons + page-flip sound (/public/audios/page-flip-01a.mp3)
    GalleryGrid.tsx    Masonry grid + GSAP scroll-reveal; cards link to /stories/[id]
    Button.tsx         Small variant button (primary/secondary/text), red-orange-500 accent
    CameraSpecs.tsx    EXIF-style spec list (lucide icons) — not wired into a route currently
    Story.tsx          "Story behind the image" card — not wired into a route currently
    LoadingSpinner.tsx Suspense fallback
    ConvexClientProvider.tsx  "use client" — wraps the app in ConvexProvider (reads NEXT_PUBLIC_CONVEX_URL; no-op if unset)
    ui/                shadcn-style primitives: card.tsx, morphing-text.tsx, typewriter-effect.tsx, word-pull-up.tsx
  lib/
    photo.ts           fetchPhotos() / fetchPhotoBySlug(): read the `photos` table via Convex, map to the `Photo` shape; resilient (returns []/null on error)
    utils.ts           cn() helper
  assets/              images/ (rk.jpg, rkpai1.png logo, project-*.jpg, testimonial-*.jpg, lbird.jpg) and icons/ (svgs)
public/
  textures/            bird1–15.jpg, book-cover.jpg, book-back.jpg, bookrough.png — consumed by the 3D book
  images/              bird*.jpg referenced by SlideShow's hard-coded grid
  audios/page-flip-01a.mp3
  favicon.ico
```

**Path alias:** `@/*` → `./src/*` ([tsconfig.json](tsconfig.json)).

## 5. Data — Convex

Photos live in a Convex `photos` table; image files live in Convex File Storage. (Previously this was a Google Sheet — see §11.)

**Schema** ([convex/schema.ts](convex/schema.ts)) — one row per photo:
`slug` (the public id in `/stories/[slug]`, was the sheet's `id`), `alt`, `width`, `height`, `story`, `imageId` (`v.id("_storage")` — was the sheet's `image_url`), `imageType`, `location?`, `createdAt` (ISO string, kept as text), `order` (ascending sort key for the galleries). Indexes: `by_slug`, `by_order`.

**Functions** ([convex/photos.ts](convex/photos.ts)):
- `list` (query) — all photos, ascending by `order`, with `imageId` resolved to `imageUrl` via `ctx.storage.getUrl`. Replaces the old `fetchFromGoogleSheet()`.
- `getBySlug` (query) — one photo by slug, url resolved. (Used by `fetchPhotoBySlug`; the `/stories/[id]` page currently still does `fetchPhotos().find(...)`, which also works.)
- `verifyAdmin` (query) — `true` iff the passed secret matches `ADMIN_SECRET`. Used by `/admin` to gate the dashboard.
- `generateUploadUrl` / `create` / `update` / `remove` / `reorder` (mutations) — all take `adminSecret` and call `assertAdmin()` which compares against `process.env.ADMIN_SECRET` (a Convex env var). `update`/`remove` also `ctx.storage.delete` the old/removed file so storage doesn't leak.

**Frontend reads:**
- Server components (`/`, `/stories`, `/stories/[id]`) use `fetchQuery(api.photos.list, {})` from `convex/nextjs` via [src/lib/photo.ts](src/lib/photo.ts), which maps the rows to the same `Photo` shape components already consumed (`id`/`src`/`image_url`/`width`/`height`/`story`/`createdAt`/`created_at`/`imageType`/`image_type`/`location?`). On any error it logs and returns `[]`/`null`. These pages still declare `export const dynamic = "force-dynamic"`.
- `/admin` (client) uses `useQuery`/`useMutation` from `convex/react` (needs `ConvexClientProvider`, wired in the root layout). Image upload flow: `generateUploadUrl` → `POST` the file bytes to that URL → get `storageId` → `create`/`update` with it. Same flow the import script uses.

**`convex/_generated/`** is created by `pnpm run convex` (`convex dev`). Until it exists, anything importing `convex/_generated/api` (i.e. `src/lib/photo.ts`, `src/app/admin/page.tsx`, `scripts/import-from-sheet.mjs`) won't typecheck/build — so run `pnpm run convex` once before `pnpm run build`.

**Env vars** (`.env.local`, not committed — see [.env.example](.env.example)):

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | local | Convex deployment URL. `convex dev` writes it for you. Required to run the app. |
| `CONVEX_DEPLOYMENT` | local | written by `convex dev`. |
| `ADMIN_SECRET` | **Convex env** (`npx convex env set ADMIN_SECRET <v>`), **and** local (`.env.local`) — only the local copy is needed for the import script | shared secret gating `/admin` writes. |
| `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_RANGE` | local | **only** for the one-time `pnpm run import:photos` (base64 service-account JSON, sheet id, optional A1 range). Remove after import. |

**One-time migration import** ([scripts/import-from-sheet.mjs](scripts/import-from-sheet.mjs)): reads the old sheet with `googleapis`, fetches each `image_url`, uploads the bytes to Convex storage, inserts a `photos` row (`order` = sheet row index). Re-runnable — rows whose slug already exists are skipped. After it succeeds in prod you can `pnpm remove googleapis`, delete the script, and drop the `GOOGLE_*` env vars.

## 6. Routes & Data Flow

- **`/`** ([src/app/page.tsx](src/app/page.tsx)) — server component: `await fetchPhotos()`, then renders `Header → Hero → SlideShow (photos[0..10]) → About → Projects (photos[0..5] mapped to {id, src, alt, story, createdAt}) → Footer`. `Testimonials` is *not* included.
- **`/stories`** ([src/app/stories/page.tsx](src/app/stories/page.tsx)) — `await fetchPhotos()` → `<Nav/>` + `<GalleryGrid photos={...}/>` inside `<Suspense>`. Empty-state branch when no photos.
- **`/stories/[id]`** ([src/app/stories/[id]/page.tsx](src/app/stories/[id]/page.tsx)) — `fetchPhotos()` then `photos.find(p => p.id === params.id)` (could use `fetchPhotoBySlug` instead — same result). `generateMetadata` derives title/description from the photo. Renders the photo via `next/image` (using `photo.width`/`photo.height`), the `story` with quote styling, posted date, optional `location` (now a real `v.optional` field on the table; renders only if set). Uses `./TypeWriter` and `./PhotoClinet` (filename intentionally misspelled). 404-style fallback when not found.
- **`/admin`** ([src/app/admin/page.tsx](src/app/admin/page.tsx)) — client; `robots:noindex` ([src/app/admin/layout.tsx](src/app/admin/layout.tsx)). Type the `ADMIN_SECRET` once (cached in `localStorage`, validated via `verifyAdmin`) → list/add/edit/delete photos. Add/edit reads image dimensions client-side, uploads to Convex storage, then calls `create`/`update`. Not linked from the site nav.
- **`/album`** ([src/app/album/page.jsx](src/app/album/page.jsx)) — client component; responsive `<Canvas>` camera; mounts `<UI/>` + `<Experience/>` (which mounts `<Book/>`). Pure 3D, does **not** touch Convex — book pages use the static `bird1–15.jpg` textures in `/public/textures` and the `pictures`/`pages` arrays hard-coded in [src/components/Book.jsx](src/components/Book.jsx).

## 7. `next.config.mjs` — remote images

`next/image` `remotePatterns` allows: `*.convex.cloud` (Convex File Storage — where photos now live), plus the legacy hosts `scv4alvjgyc18iwi.public.blob.vercel-storage.com` and `*.edgestore.dev` (kept so any pre-migration `image_url` still resolves). If a photo URL ever points at a new host, add it here or `next/image` throws. (The `/admin` thumbnails use plain `<img>`, so they're unaffected.)

## 8. Styling & Conventions

- **Theme baseline:** `<body>` is `bg-stone-200 text-stone-900` (light, warm). shadcn HSL CSS variables (`--background`, `--primary`, …) and a `.dark` class variant exist in `globals.css`, and Tailwind `darkMode: ["class"]` is set — but no dark-mode toggle is wired; story/gallery pages just hard-code `dark:` utility classes that won't activate without a `class="dark"` ancestor.
- **Accent color:** `red-orange-500` (`#FF3F34`) — Tailwind custom color, used by `Button.tsx`.
- **Tailwind content globs:** only `src/app`, `src/sections`, `src/components`. A new top-level dir with JSX needs to be added to [tailwind.config.ts](tailwind.config.ts) or its classes won't be generated.
- **`@ts-nocheck` / `eslint-disable`:** most `.jsx` files and several `.tsx` files start with `/* eslint-disable */` and `// @ts-nocheck`. The codebase is loosely typed by design in those files; don't expect type safety there. When editing them, match the surrounding (untyped) style rather than introducing partial typing.
- **Server vs client:** route pages that fetch are server components; anything using hooks/animation/R3F is `"use client"`. `force-dynamic` is the norm for data pages.
- **Naming:** components `PascalCase`; the `PhotoClinet.tsx` filename typo is load-bearing (imported by that name) — leave it unless you fix the import too.
- **Images:** local assets via `@/assets/...` imports; remote photo URLs from the sheet; the 3D book and `SlideShow` use static `/public` paths.

## 9. Known Rough Edges (don't "fix" without checking intent)

- `Testimonials.tsx` and `CameraSpecs.tsx` / `Story.tsx` contain placeholder content and aren't mounted — they're scaffolds, not dead code to delete blindly.
- `SlideShow.tsx`'s `PortfolioGrid` uses hard-coded `/images/birdN.jpg` paths and ignores the `photos` prop the homepage passes it (the page passes `photos.slice(0,10)` but the component doesn't consume it).
- `prisma`/`aws-sdk` deps are unused (see §2).
- Two lockfiles in the repo (`package-lock.json` and `pnpm-lock.yaml`) — use pnpm.
- `prettier.config.js` uses CommonJS `module.exports` in an otherwise ESM-ish project — fine, just don't be surprised.
- **`pnpm run build` fails until `pnpm run convex` has been run once** (it generates `convex/_generated/`, which `src/lib/photo.ts` and `src/app/admin/page.tsx` import). This is the expected state of the repo right after the migration commit — not a bug.
- `/admin` is protected only by a shared secret in a Convex env var. Fine for a one-person portfolio site; swap in real auth if that ever changes.

## 10. Dev Setup

```bash
pnpm install
pnpm approve-builds            # once — lets esbuild (Convex) / prisma run their postinstall scripts

# First-time Convex setup (opens a browser to log in / pick or create a project):
pnpm run convex                # = convex dev — provisions the deployment, generates convex/_generated, writes NEXT_PUBLIC_CONVEX_URL + CONVEX_DEPLOYMENT into .env.local
npx convex env set ADMIN_SECRET <a-strong-value>
# add ADMIN_SECRET=<same value> to .env.local too (the import script reads it locally)

# In a second terminal:
pnpm run dev                   # http://localhost:3000   (/admin for the photo dashboard)

# One-time data migration from the old Google Sheet (optional — skip if starting fresh):
# add GOOGLE_APPLICATION_CREDENTIALS (base64 JSON), GOOGLE_SHEET_ID, [GOOGLE_SHEET_RANGE] to .env.local, then:
pnpm run import:photos
```

Without `NEXT_PUBLIC_CONVEX_URL` the app still runs but `fetchPhotos()` catches the error and the site renders with zero photos. `pnpm run build` fails until `pnpm run convex` has generated `convex/_generated/` at least once.

## 11. Conversation Log — engineering decisions & session summaries

Reverse-chronological. Each entry = the reason-to-exist for some change, or a summary of what a session did. When changing anything described here, read the rationale first so you don't regress the intent.

### 2026-05-12 — Migrated the photo data source from Google Sheets to Convex (+ /admin CRUD, File Storage)

**What & why.** The photo set used to be read live from a Google Sheet on every request (`src/lib/googleSheets.ts` + `googleapis`, base64 service-account creds). Replaced with a real DB: a Convex `photos` table, image bytes in Convex File Storage, plus a small `/admin` dashboard so photos are managed in-app instead of by editing a spreadsheet. Image hosting moved into Convex storage (was external Vercel-Blob / edgestore URLs).

**Shape of the change:**
- `convex/schema.ts` — `photos` table: `slug` (public id, was the sheet `id`), `alt`, `width`, `height`, `story`, `imageId` (`v.id("_storage")`, was `image_url`), `imageType`, `location?`, `createdAt` (ISO string), `order` (asc sort key). Indexes `by_slug`, `by_order`.
- `convex/photos.ts` — queries `list` / `getBySlug` (resolve `imageId` → `imageUrl`) / `verifyAdmin`; mutations `generateUploadUrl` / `create` / `update` / `remove` / `reorder`, all gated by `assertAdmin(adminSecret)` which compares to `process.env.ADMIN_SECRET` (a Convex env var). `update`/`remove` delete the old/removed storage file so it doesn't leak.
- `src/lib/photo.ts` — rewritten: `fetchPhotos()` now does `fetchQuery(api.photos.list, {})` (from `convex/nextjs`) and maps rows to the **same** `Photo` shape (`id`/`src`/`image_url`/`width`/`height`/`story`/`createdAt`/`created_at`/`imageType`/`image_type`/`location?`) — so `page.tsx`, `/stories`, `/stories/[id]`, `GalleryGrid`, `Projects` were untouched. Added `fetchPhotoBySlug()`. `src/lib/googleSheets.ts` deleted.
- `src/components/ConvexClientProvider.tsx` (new, `"use client"`) wraps the app in `ConvexProvider`; wired into `src/app/layout.tsx`. No-ops if `NEXT_PUBLIC_CONVEX_URL` is unset (so a pre-`convex dev` build doesn't crash at module load — though it still won't *build* without `convex/_generated`).
- `src/app/admin/{layout.tsx,page.tsx}` (new) — `layout.tsx` sets `robots:noindex`; `page.tsx` is the CRUD client UI: secret gate (localStorage + `verifyAdmin`), list, add (file → read dimensions client-side → `generateUploadUrl` → POST bytes → `create`), inline edit (optional image replace), delete. Plain `<img>` thumbnails (not `next/image`), so no remote-host config needed for admin.
- `next.config.mjs` — `images.remotePatterns` now includes `*.convex.cloud`; kept the two legacy hosts as fallbacks.
- `scripts/import-from-sheet.mjs` (new) — one-time: read the old sheet with `googleapis` → fetch each `image_url` → upload to Convex storage → `create` a `photos` row (`order` = sheet row index). Re-runnable (skips existing slugs). After it runs in prod: `pnpm remove googleapis`, delete the script, drop the `GOOGLE_*` env vars.
- `package.json` — added `convex` dep; moved `googleapis` to devDependencies; new scripts `convex` (`convex dev`) and `import:photos`. `.env.example` added.

**Decisions / trade-offs:**
- *Auth:* `/admin` writes are gated by a single shared secret stored as a Convex env var (queries stay public — the site is public). Deliberately minimal; a one-person portfolio doesn't need Convex Auth. The secret is server-side (Convex env), never shipped in the bundle; the client only holds whatever the operator typed.
- *Why `api` from `convex/_generated` (not `makeFunctionReference`)*: it's the idiomatic Convex shape and `_generated` is committed to the repo. Cost: the repo doesn't build until `pnpm run convex` has run once — accepted, since that's step one of setup anyway and is documented in §3/§5/§9/§10.
- *`force-dynamic` kept* on the data pages — could later switch to ISR/`revalidateTag`, but out of scope here.
- *`/stories/[id]` left calling `fetchPhotos().find(...)`* rather than `fetchPhotoBySlug` — minimal diff; both work.

**Status / what's NOT done:**
- `pnpm run convex` (provisioning) and `npx convex env set ADMIN_SECRET ...` must be run by a human — couldn't be done in this session. So the migration is **code-complete but not yet wired to a live deployment**, and the build will fail until that's done.
- The actual data import (`pnpm run import:photos`) hasn't been run.
- No `convex/_generated/` committed yet (it appears after `convex dev`).
- Not done (flagged for later): removing `googleapis` + the import script after import; switching data pages to ISR; admin reorder UI (the `reorder` mutation exists, no UI yet); using `fetchPhotoBySlug` in `/stories/[id]`.

### 2026-05-12 — CONTEXT.md created

- Audited the repo and wrote this file. No code changes. Key findings: data was Google-Sheets-backed (no DB) — *since superseded, see the entry above*; `prisma`/`aws-sdk` deps are vestigial; `/album` is a self-contained R3F flipbook on static textures; most files are `@ts-nocheck`; `dynamic = "force-dynamic"` on all data pages.
- Established the working-style guidelines in §0: ask-before-coding-when-vague, commit after major changes, append session summaries here, never delete this file.

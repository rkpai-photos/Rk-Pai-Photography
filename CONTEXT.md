# RK Pai Photography — Codebase Context

> Persistent reference for Claude Code sessions. Read this first to orient before exploring.

## 0. Working style (applies every session)

- **Clarify the prompt and any commands before you implement.** Before touching code, restate what you're about to do and confirm the intent of the request (and of any command/script the user asked you to run). If the request is ambiguous, under-scoped, could be read multiple ways, or hinges on a decision only the developer can make (which dependency, which file, delete vs. keep, scope boundaries), ask a focused question *first* — don't guess and redo. A round-trip is cheap; reworking the wrong thing is not.
- **State your assumptions, out loud, to the developer.** Whenever you proceed without an explicit answer — picking an obvious default, inferring scope, interpreting a vague word, assuming something is safe to remove/change — say so plainly in your response ("Assuming X; say so if not"). Don't bury assumptions in the diff. If an assumption turns out to matter, the developer should have had the chance to correct it before the work landed.
- **Security is non-negotiable — treat every change like it's going to production.**
  - **Never put a secret in source code.** No API keys, tokens, passwords, connection strings, service-account JSON, or shared secrets — ever, not even "temporarily", not in comments, not in test files. Read them from environment variables (`process.env.*`) or the platform's secret store (`npx convex env set …`, hosting-provider env settings). `.env*.local` and `.env` are gitignored — keep it that way; never commit a real value. (This repo deliberately has **no `.env.example`** — the required env vars are documented in §5; don't re-add one.)
  - **Never expose a secret to the client.** Anything prefixed `NEXT_PUBLIC_` is shipped in the browser bundle and is public by definition — only non-sensitive config goes there. Secrets must stay server-side (Convex functions, Next.js server components / route handlers / server actions). Don't store secrets in `localStorage`/`sessionStorage`, don't pass them as client→server function arguments if a server-only path exists, don't put them in URLs, don't log them, don't echo them in error messages.
  - **Authorize on the server, with least privilege.** Validate inputs, check permissions in the Convex function / server route — never trust the client. Scope credentials to the minimum needed.
  - **If a change would weaken any of this, stop and flag it** rather than shipping it. Call out known security limitations explicitly (in the PR, the response, and the Conversation Log).
- **Commit after every major change.** After a meaningful feature, refactor, schema/data-source change, or any non-trivial fix, make a git commit with a clear message. Don't leave large changes uncommitted across sessions.
- **Append a chat summary to this file.** After a substantial change or a notable session, add a concise entry to the **Conversation Log** (section 11) — what changed, why, and anything a future session would otherwise have to re-derive from code alone. Keep trivial fixes out of it.
- **Never delete this file.** `CONTEXT.md` is the project's persistent memory. Update by appending; if it gets corrupted, restore from the last good version in git history.

## 1. Project Purpose

**RK Pai Photography** is a marketing/portfolio website for a wildlife photographer (RK Pai). It showcases bird & wildlife photography with story-driven detail pages and an interactive 3D photo-book "album". The photo set lives in a **Convex** database (table `photos`), with image files in **Convex File Storage**. There's a lightweight `/admin` dashboard for adding/editing/deleting photos. *(Migrated off Google Sheets — see §11.)*

Single Next.js app, public-facing. `/admin` is gated by **Convex Auth** (email + password) plus an `ADMIN_EMAILS` allow-list; the public site needs no auth.

## 2. Tech Stack

- **Framework:** Next.js `14.2.18` (App Router), React 18, TypeScript 5
- **Styling:** TailwindCSS 3.4 + `tailwindcss-animate`; shadcn/ui scaffolding (`components.json`, CSS variables in [src/app/globals.css](src/app/globals.css)); `clsx` + `tailwind-merge` via `cn()` in [src/lib/utils.ts](src/lib/utils.ts)
- **Animation:** Framer Motion / `motion`, GSAP `3.12` + `ScrollTrigger`, `split-type`
- **3D:** React Three Fiber `8` + `@react-three/drei` `9` + `maath` + `three` — used only by the `/album` flipbook
- **State:** Jotai (`pageAtom` driving the 3D book; not used elsewhere)
- **Gallery layout:** `react-masonry-css`
- **Data:** **Convex** (`convex` ^1.38) — `photos` table + File Storage; reads via `convex/nextjs` `fetchQuery` in server components, `convex/react` `useQuery`/`useMutation` in the `/admin` client page. See §5.
- **Auth (`/admin` only):** **Convex Auth** (`@convex-dev/auth` ^0.0.92, `@auth/core` 0.37.0) — Password provider + Next.js integration (`@convex-dev/auth/nextjs`, `src/proxy.ts` — the Next 16 rename of the `middleware` file convention). See §5.
- **Icons:** `lucide-react` &nbsp;|&nbsp; **Fonts:** Archivo via `next/font/google` (`--font-archivo`, the Tailwind `sans` family) + Poppins imported via Google Fonts CSS in `globals.css`
- **Lint/format:** ESLint (`next/core-web-vitals` + `next/typescript`), Prettier (`tabWidth: 2`)
- **`googleapis`** was a devDependency for the one-time Google-Sheet import script — both removed on 2026-05-13 (see §11). `dotenv` was removed at the same time (its only consumer was that script).
- **Vestigial deps still in `package.json`:** `lodash` (used in `UI.jsx` for `debounce` — that's the only use). The earlier DynamoDB/Prisma leftovers (`@prisma/client`, `prisma`, `aws-sdk`, `@aws-sdk/*`) and the unused `motion`/`split-type`/`class-variance-authority` have been removed (see §11).

## 3. Commands

Use **pnpm** for installation and other checks.

```bash
pnpm install                 # install deps (run `pnpm approve-builds` once for esbuild/prisma postinstall scripts)
pnpm run convex              # `convex dev` — provisions/syncs the Convex backend, generates convex/_generated, writes NEXT_PUBLIC_CONVEX_URL to .env.local. Run this first, keep it running in dev.
pnpm run dev                 # Next.js dev server — http://localhost:3000  (run in a second terminal)
pnpm run build               # production build  (needs convex/_generated to exist — i.e. `pnpm run convex` has run at least once)
pnpm run start               # serve the production build
pnpm run lint                # eslint . (ESLint 9 flat config — `next lint` was removed in Next 16)
```

No test suite exists. Both `package-lock.json` and `pnpm-lock.yaml` are tracked and kept in sync (deliberately, per a 2026-05-13 call — see §11); prefer pnpm for day-to-day work, and if you change deps, run both `pnpm install` and `npm install` so neither lockfile drifts.

The one-time Google Sheet → Convex import script (`pnpm run import:photos` / `scripts/import-from-sheet.mjs`) was removed on 2026-05-13 — the migration is done. See §11.

## 4. Directory Layout

```
convex/                Convex backend
  schema.ts            `...authTables` (Convex Auth: users, authSessions, …) + `photos` table (slug, alt, width, height, story, imageId -> _storage, imageType, location?, createdAt, order) + by_slug / by_order indexes
  photos.ts            queries: list, getBySlug · mutations (auth-gated via assertAdmin → Convex Auth + ADMIN_EMAILS): generateUploadUrl, create, update, remove, reorder. `generateUploadUrl`+`create` still carry a one-time `migrationToken` bypass arg — now vestigial (the import script that used it is gone); should be removed (see §9/§11).
  auth.ts              Convex Auth setup — `convexAuth({ providers: [Password] })`, exports auth/signIn/signOut/store/isAuthenticated
  auth.config.ts       JWT config (domain = CONVEX_SITE_URL, applicationID "convex")
  http.ts              `auth.addHttpRoutes(http)` — registers /.well-known/* (+ /api/auth/* if OAuth is added)
  setup.ts             one-time `internalAction createAdmin({ email, password })` — bootstraps the admin account via `createAccount`. Run: `npx convex run setup:createAdmin '{"email":"...","password":"..."}'`
  tsconfig.json        Convex-functions tsconfig
  _generated/          (created by `pnpm run convex` — committed once it exists; the app imports `api`/`dataModel` from here)
src/
  proxy.ts             Convex Auth Next.js proxy (Next 16's rename of the `middleware` file convention; same runtime contract — default-exported handler + `config` matcher) — gates /admin* → /admin/login, forwards /api/auth/*. MUST be `src/proxy.ts`, not repo root (this project uses a `src/` dir — Next.js ignores a root-level one here).
  app/                 Next.js App Router
    layout.tsx         Root layout — Archivo font, <body> = bg-stone-200 / text-stone-900; wraps in <ConvexAuthNextjsServerProvider> → <ConvexClientProvider>
    globals.css        Tailwind layers + shadcn CSS vars + Poppins import + .fade-to-transparent util
    page.tsx           "/"  landing page (server component)
    admin/
      layout.tsx       robots:noindex metadata for the /admin route
      page.tsx         "/admin" — photo CRUD dashboard (client; <Authenticated> gate -> list/add/edit/delete; uploads to Convex storage; Sign out)
      login/page.tsx   "/admin/login" — Convex Auth email+password sign-in only; password show/hide toggle
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
    Nav.tsx            Minimal nav (logo + home button) — now UNUSED (all public pages use Header.tsx); kept, not deleted
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
    ConvexClientProvider.tsx  "use client" — wraps the app in ConvexAuthNextjsProvider over a ConvexReactClient (reads NEXT_PUBLIC_CONVEX_URL; renders children bare if unset)
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
- `list` (query) — all photos, ascending by `order`, with `imageId` resolved to `imageUrl` via `ctx.storage.getUrl`. Public. Replaces the old `fetchFromGoogleSheet()`. (`.collect()` is intentional — a portfolio's photo set is bounded and the gallery renders all of it.)
- `getBySlug` (query) — one photo by slug, url resolved. Public. (Used by `fetchPhotoBySlug`; the `/stories/[id]` page currently still does `fetchPhotos().find(...)`, which also works.)
- `generateUploadUrl` / `create` / `update` / `remove` / `reorder` (mutations) — gated by `assertAdmin(ctx)`: requires a Convex Auth session (`getAuthUserId`) **and** the user's email to be on the `ADMIN_EMAILS` allow-list (comma-separated Convex env var). Being signed in is necessary but not sufficient. `update`/`remove` also `ctx.storage.delete` the old/removed file. **Vestigial:** `generateUploadUrl`+`create` still accept an optional `migrationToken` (via `assertAdminOrMigration`) matched against `process.env.MIGRATION_TOKEN` — this was the one-time import script's escape hatch; that script is gone (2026-05-13), so this is now dead code *and* a latent auth bypass — remove it, and make sure no deployment has `MIGRATION_TOKEN` set.
- **Auth backend:** [convex/auth.ts](convex/auth.ts) (`convexAuth({ providers: [Password] })`), [convex/auth.config.ts](convex/auth.config.ts) (JWT config), [convex/http.ts](convex/http.ts) (`auth.addHttpRoutes`), and `...authTables` spread into [convex/schema.ts](convex/schema.ts). [src/proxy.ts](src/proxy.ts) (Next 16's renamed middleware) redirects unauthenticated visitors from `/admin*` to `/admin/login` and (when signed in) away from `/admin/login`.

**Frontend reads:**
- Server components (`/`, `/stories`, `/stories/[id]`) use `fetchQuery(api.photos.list, {})` from `convex/nextjs` via [src/lib/photo.ts](src/lib/photo.ts), which maps the rows to the same `Photo` shape components already consumed (`id`/`src`/`image_url`/`width`/`height`/`story`/`createdAt`/`created_at`/`imageType`/`image_type`/`location?`). On any error it logs and returns `[]`/`null`.
- `/admin` (client) — `src/proxy.ts` enforces auth; the page also wraps content in `<Authenticated>`/`<Unauthenticated>`/`<AuthLoading>` from `convex/react`. Sign-in via `useAuthActions().signIn("password", {...})` on `/admin/login`; sign-out via `useAuthActions().signOut()`. Photo writes use `useMutation` (no secret args). Image upload flow: `generateUploadUrl` → `POST` the file bytes to that URL → get `storageId` → `create`/`update` with it. (The `ConvexAuthNextjsProvider` in the tree stores the session token in `localStorage` by default — that's a short-lived JWT, not a password, and it's the standard Convex Auth setup; pass `storage: "inMemory"` to the server provider if you'd rather not.)

**`convex/_generated/`** is created by `pnpm run convex` (`convex dev`). Until it exists, anything importing `convex/_generated/api` (`src/lib/photo.ts`, `src/app/admin/*`, `convex/photos.ts`, `convex/http.ts`) won't typecheck/build — so run `pnpm run convex` once before `pnpm run build`. (It's committed once generated.)

**Env vars** (`.env.local`, not committed — there is intentionally no `.env.example`; the full list is the table below):

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | local | Convex deployment URL. `convex dev` writes it. Required to run the app. |
| `CONVEX_DEPLOYMENT` | local | written by `convex dev`. |
| `CONVEX_SITE_URL` | Convex env (auto) | set by Convex on every deployment; read by `convex/auth.config.ts`. |
| `JWT_PRIVATE_KEY`, `JWKS` | Convex env | Convex Auth signing keys — generated + set by `npx @convex-dev/auth`. |
| `SITE_URL` | Convex env | your app's URL (e.g. `http://localhost:3000` / prod URL) — set by `npx @convex-dev/auth` or `npx convex env set SITE_URL ...`. |
| `ADMIN_EMAILS` | Convex env | comma-separated allow-list of emails permitted to write photos: `npx convex env set ADMIN_EMAILS "you@example.com"`. |

> `MIGRATION_TOKEN` and the `GOOGLE_*` vars were only ever needed for the one-time Google-Sheet→Convex import, which is done; the import script was removed on 2026-05-13. If `MIGRATION_TOKEN` is still set on any deployment, remove it (`npx convex env remove MIGRATION_TOKEN`) — `convex/photos.ts` still honours it as an auth bypass until that vestigial code is deleted (see §9).

## 6. Routes & Data Flow

- **`/`** ([src/app/page.tsx](src/app/page.tsx)) — server component: `await fetchPhotos()`, then renders `Header → Hero → SlideShow (photos[0..10]) → About → Projects (photos[0..5] mapped to {id, src, alt, story, createdAt}) → Footer`. `Testimonials` is *not* included.
- **`/stories`** ([src/app/stories/page.tsx](src/app/stories/page.tsx)) — `await fetchPhotos()` → `<Header/>` (the shared one) + `<GalleryGrid photos={...}/>` inside `<Suspense>`. Empty-state branch when no photos.
- **`/stories/[id]`** ([src/app/stories/[id]/page.tsx](src/app/stories/[id]/page.tsx)) — `fetchPhotos()` then `photos.find(p => p.id === params.id)` (could use `fetchPhotoBySlug` instead — same result). `generateMetadata` derives title/description from the photo. Renders `<Header/>` + the photo via `next/image` (using `photo.width`/`photo.height`), the `story` with quote styling, posted date, optional `location` (a real `v.optional` field; renders only if set), and a like + **share** button ([./PhotoClinet.tsx](src/app/stories/[id]/PhotoClinet.tsx) — `PhotoDetailClient`; the share button uses `navigator.share` with a copy-link + "Link copied" fallback). Uses `./TypeWriter`. 404-style fallback (also has `<Header/>`) when not found.
- **`/admin/login`** ([src/app/admin/login/page.tsx](src/app/admin/login/page.tsx)) — client; Convex Auth email + password **sign-in only** (no self-service sign-up — admin account is bootstrapped via `npx convex run setup:createAdmin`). Password field has a show/hide (eye) toggle.
- **`/admin`** ([src/app/admin/page.tsx](src/app/admin/page.tsx)) — client; `robots:noindex` ([src/app/admin/layout.tsx](src/app/admin/layout.tsx)). `src/proxy.ts` redirects here→`/admin/login` if unauthenticated; the page also `<Authenticated>`-gates. Signed in → list/add/edit/delete photos + Sign out. Add/edit reads image dimensions client-side, uploads to Convex storage, then calls `create`/`update`. Only emails on `ADMIN_EMAILS` can actually write — others see a "Not authorized" error. Not linked from the site nav.
- **`/album`** ([src/app/album/page.jsx](src/app/album/page.jsx)) — client component; renders `<Header/>` over a responsive `<Canvas>` (camera per breakpoint) plus the `<UI/>` book-control overlay; the canvas mounts `<Experience/>` → `<Book/>`. Pure 3D, does **not** touch Convex — book pages use the static `bird1–15.jpg` textures in `/public/textures` and the `pictures`/`pages` arrays hard-coded in [src/components/Book.jsx](src/components/Book.jsx). (`UI.jsx` previously had its own "Wildlife Photography" title overlay; that was removed once the shared `<Header/>` landed here.)

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
- **`pnpm run build` fails until `pnpm run convex` has been run once** (it generates `convex/_generated/`, which `src/lib/photo.ts`, `src/app/admin/*`, `convex/photos.ts` and `convex/http.ts` import). Expected for a fresh checkout — not a bug. Also: `npx @convex-dev/auth` must have set the Convex Auth env vars (`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`) or the `/admin` login will fail at runtime (the build still passes).
- **Everything renders dynamically now** (`ƒ`, not `○` static) — `ConvexAuthNextjsServerProvider` reads auth cookies in the root layout, and `src/proxy.ts` (the Next 16 middleware rename) runs on all routes. That's the standard Convex Auth Next.js setup; for a portfolio site the perf cost is negligible (the photo pages were already `force-dynamic`). Don't "fix" by removing the provider/proxy.
- **`/admin` auth (post-hardening):** now Convex Auth (email+password) + an `ADMIN_EMAILS` allow-list for write authorization — no app secret in the client. Self-service sign-up is disabled (no UI affordance, and `convex/auth.ts`'s `Password({ profile })` rejects `signUp` for any email not on `ADMIN_EMAILS`); the admin account is created via `npx convex run setup:createAdmin`. Residuals worth knowing: (a) the session JWT lives in `localStorage` by default (Convex Auth's standard; short-lived & revocable — switch to `storage: "inMemory"` on the server provider if you want); (b) the `migrationToken` escape hatch on `generateUploadUrl`/`create` is a real bypass that works whenever `MIGRATION_TOKEN` is set on the deployment — the import script that needed it was deleted on 2026-05-13, so this code is now pure dead weight: **delete the `migrationToken` arg + `assertAdminOrMigration` in `convex/photos.ts` and ensure no deployment has `MIGRATION_TOKEN` set**. See §11.

## 10. Dev Setup

```bash
pnpm install
pnpm approve-builds            # once — lets esbuild (Convex) / prisma run their postinstall scripts

# 1) Provision Convex (opens a browser to log in / pick or create a project):
pnpm run convex                # = convex dev — provisions the deployment, generates convex/_generated, writes NEXT_PUBLIC_CONVEX_URL + CONVEX_DEPLOYMENT into .env.local. Keep it running in dev.

# 2) Convex Auth (one-time): generates + sets JWT keys and SITE_URL on the deployment:
npx @convex-dev/auth --web-server-url http://localhost:3000 --skip-git-check   # (use the prod URL + `--prod` for production)
npx convex env set ADMIN_EMAILS "you@example.com"   # who may write photos / sign up (comma-separated)
# create the admin account (password is an arg — not stored anywhere):
npx convex run setup:createAdmin '{"email":"you@example.com","password":"<password>"}'

# 3) Run it (second terminal):
pnpm run dev                   # http://localhost:3000  →  /admin/login → sign in
```

(The old Google-Sheet → Convex data import was a one-time step; the script was removed on 2026-05-13. Add photos via `/admin`.)

Notes: without `NEXT_PUBLIC_CONVEX_URL` the app still runs but `fetchPhotos()` catches the error and the site renders zero photos. `pnpm run build` fails until `pnpm run convex` has generated `convex/_generated/` at least once. `/admin/login` fails at runtime until the Convex Auth env vars (step 2) are set.

## 11. Conversation Log — engineering decisions & session summaries

Reverse-chronological. Each entry = the reason-to-exist for some change, or a summary of what a session did. When changing anything described here, read the rationale first so you don't regress the intent.

### 2026-05-13 — Comprehensive SEO pass (sitemap, robots, metadata, JSON-LD, OG images, icons)

Full SEO setup for `https://www.rkpai.in` (DNS-verified in Google Search Console — no HTML verification meta tag needed). *(Brainstormed via `superpowers:brainstorming`; design-doc + spec-review skipped per the user pattern, decisions captured here.)*

**Single source of truth — [src/lib/site.ts](src/lib/site.ts):**
`siteUrl = "https://www.rkpai.in"` (www, not apex — user runs with the www subdomain), `siteName`, `siteLocale = "en_IN"`, `defaultTitle`, `titleTemplate = "%s · Rk Pai Photography"`, `defaultDescription`, `defaultKeywords`, a `person` object (name "RK Pai", `jobTitle: "Wildlife Photographer"`, email, `sameAs: [facebook.com/rkpaiin, instagram.com/rk.pai]`), and an `absoluteUrl(path)` helper. Every metadata/sitemap/JSON-LD/OG file imports from here so the domain or brand info change in one place.

**New metadata routes:**
- [src/app/sitemap.ts](src/app/sitemap.ts) → `/sitemap.xml`. Static routes (`/`, `/stories`, `/album`) + every photo as `/stories/[slug]` with the photo URL in `images: [...]` (Google reads that field for Image Search — the biggest organic-discovery lever for a photo site). `priority` weighted (1.0 home → 0.8 photos → 0.7 album), `lastModified` from `photo.createdAt`.
- [src/app/robots.ts](src/app/robots.ts) → `/robots.txt`. `allow: "/"`, `disallow: ["/admin", "/admin/", "/api/"]`, points at `/sitemap.xml`.
- [src/app/manifest.ts](src/app/manifest.ts) → `/manifest.webmanifest`. Standalone display, `theme_color: stone-900`, `background_color: stone-200`, icons pointing at the dynamic `/icon` and `/apple-icon` routes.

**Icons + Open Graph image generators (Next's `ImageResponse`):**
- [src/app/icon.tsx](src/app/icon.tsx) — 32×32 favicon: "rk" lowercase on stone-900.
- [src/app/apple-icon.tsx](src/app/apple-icon.tsx) — 180×180: "RK / PAI" stacked with a red-orange hairline accent (matches the curtain loader's brand language).
- [src/app/opengraph-image.tsx](src/app/opengraph-image.tsx) — default 1200×630 social card: stone-200 field, "RK PAI" wordmark, "Photography" caption, red-orange hairline, "rkpai.in" footer. Auto-wired into root `openGraph.images` via `metadataBase`. Uses Georgia (Satori can't pick up `next/font/google` fonts without bundling the woff2 — Georgia fallback is close enough to Playfair for the social-card scale).
- [src/app/stories/[id]/opengraph-image.tsx](src/app/stories/[id]/opengraph-image.tsx) — **per-photo dynamic OG (the big win for social sharing)**: fetches the photo by slug from Convex, renders the photograph at 1200×630 with a bottom gradient + small "RK Pai · Photography" watermark. When someone shares `/stories/abc` on Facebook/Instagram/WhatsApp, the preview is *that bird photo*, not a generic site card. Falls back to a brand panel if the photo can't be fetched.

**Page metadata + JSON-LD:**
- [src/app/layout.tsx](src/app/layout.tsx) — added `metadataBase`, title `default` + `template`, applicationName, authors/creator/publisher, keywords, default OG + Twitter (`summary_large_image`), `robots: { index, follow, googleBot: { "max-image-preview": "large" } }`. Removed the manual `<link rel="icon" href="/favicon.ico">` from `<head>` — Next now auto-emits the icon links from `app/icon.tsx`/`apple-icon.tsx`. Injects site-level `WebSite + Person` JSON-LD via the new [src/components/JsonLd.tsx](src/components/JsonLd.tsx) helper (XSS-safe: `<` escaped to `<` per the [Next JSON-LD guide](https://nextjs.org/docs/app/guides/json-ld)).
- [src/app/stories/page.tsx](src/app/stories/page.tsx) — `metadata` with title "Stories" (template → "Stories · Rk Pai Photography"), description, canonical, OG/Twitter. Injects `CollectionPage` JSON-LD.
- [src/app/stories/[id]/page.tsx](src/app/stories/[id]/page.tsx) — `generateMetadata` rewritten: title from `photo.alt`, description from `photo.story` (clamped to 160 chars), canonical, OG `type: "article"` with `publishedTime` + `authors`, Twitter card. OG image auto-wired from the sibling `opengraph-image.tsx`. Injects `Photograph` JSON-LD with `name`, `description`, `caption`, `contentUrl`, `thumbnailUrl`, `width/height`, `datePublished`, `creator/copyrightHolder/author = Person`, `inLanguage`, and `contentLocation`/`locationCreated` (when `photo.location` is set). The `Photograph` schema (a real schema.org type) is what Google looks for to surface a photo with proper credit + caption in Image Search results.
- [src/app/album/layout.tsx](src/app/album/layout.tsx) NEW — `/album/page.jsx` is `"use client"` (R3F `<Canvas>`) so it can't export `metadata`; the album's metadata + canonical + OG sit in a sibling server-component layout instead. (Same pattern as `admin/layout.tsx`'s `robots: noindex`.)

**Notes / non-decisions:**
- **DNS-verified GSC** → no `verification` field on the layout metadata.
- **www, not apex** → submit `/sitemap.xml` to GSC under the `https://www.rkpai.in` property; do a 301 from apex to www at the DNS/host level (standard).
- `Person.sameAs` includes the user's Facebook + Instagram — helps Google's knowledge graph link the site to the broader online identity.
- The `Projects.tsx` home-page section was migrated to `<TransitionLink>` earlier this session (was `<a>` hard-nav); SEO-wise that's still a plain anchor `<a>` in the rendered HTML, so crawlable.
- **Build not run here** — `next dev` is up (PID 1577), and CONTEXT.md §9 warns running `pnpm run build` under a live dev server can leave a half-written `.next/`. `npx tsc --noEmit` is clean across the new files. Verify with a real production build after restarting `next dev` (or after deploy).

**After deploy, in Google Search Console:**
1. Submit the sitemap (`https://www.rkpai.in/sitemap.xml`).
2. Use Inspect URL on a couple of `/stories/[slug]` pages to confirm Google sees the rendered HTML + Open Graph + JSON-LD.
3. Run a few URLs through [Google's Rich Results Test](https://search.google.com/test/rich-results) to confirm the `Photograph`/`WebSite`/`CollectionPage` schemas validate.

### 2026-05-13 — Tuned the curtain wipe: smoother timing + proper editorial typography

Polish pass on the curtain-wipe loader from the previous entry.

- **Smoothness**: duration 450 → 550ms, easing `cubic-bezier(.77, 0, .18, 1)` (snappy expo) → `cubic-bezier(.65, 0, .35, 1)` (ease-in-out cubic). Less abrupt at both ends, glides into and out of the seam. `MIN_VISIBLE_MS` 800 → 850 so the curtain still has ~300ms of fully-covered "brand visible" hold between the 550ms close and 550ms open (total minimum transition ≈ 1450ms on in-app navs; cold loads still ignore the floor).
- **Typography**: loaded **Playfair Display** properly via `next/font/google` in [src/app/layout.tsx](src/app/layout.tsx) (weights 400/700/800, `display: swap`, exposed as `--font-playfair`) and added a `playfair` entry to [tailwind.config.ts](tailwind.config.ts) so `font-playfair` is finally a real class. Wordmark "RK PAI" now uses Playfair 800 at `clamp(2rem, 7vw, 4.5rem)` with tight `0.04em` tracking on `text-stone-100`; the "Photography" caption uses Archivo (the body sans) at weight 300, uppercase via `text-transform`, wide `0.4em` tracking on `text-stone-400` — classic editorial serif/sans contrast. Roman (non-italic) — documentary feel, not magazine-italic.
- **Side benefit**: the orphan `font-playfair` classes scattered through [src/app/stories/[id]/page.tsx](src/app/stories/[id]/page.tsx) (which used to fall back to Archivo silently because Playfair was never loaded — see §8) now actually render in Playfair.
- **Heads-up**: the dev server may need a restart after pulling this — `next/font` fetches Google Fonts at build/dev-server start, so adding a new font isn't always picked up by HMR.

### 2026-05-13 — Switched the page-transition visual to "Curtain wipe" (option B)

The first cut used option A (Wordmark draw-on); the user found it too quiet and asked for option B instead. Same wait-for-critical-images logic underneath — only the overlay's visual changed:

- **Two `bg-stone-900` panels** (top-half and bottom-half) slide in to meet at screen-centre, "**RK&nbsp;PAI**" anchored at the bottom edge of the top panel, "**PHOTOGRAPHY**" at the top edge of the bottom panel — so when the curtain is closed the brand sits stacked across the seam. Slide out (top up, bottom down) on reveal. Easing: `cubic-bezier(0.77, 0, 0.18, 1)` over 450ms each way ("expo" snap, the film-slate / cinematic curve from the brainstorm mockup).
- **Driven by `transition: transform …` on inline `style`** — `state.visible` flipping in either direction naturally triggers the close or open animation; no `@keyframes` remounting tricks needed (the previous wordmark + bar approach is gone). The `transitionId` field on `pageTransitionAtom` is now vestigial (no element keys on it anymore) but kept for shape stability and the popstate increment.
- **`MIN_VISIBLE_MS` bumped 600 → 800ms** so the curtain has ~350ms of fully-covered "brand visible" hold between the 450ms close and the 450ms open. Cold loads still ignore the floor (`startedAt = 0`).
- **`prefers-reduced-motion`** now just kills the slide (`transition: none` on the `.rkpai-transition-panel` marker class) — panels snap show/hide. No more keyframe-redefinition trick. The previous `rkpai-wordmark-stroke` / `rkpai-bar-grow` keyframes were removed from `globals.css`.
- **All other behaviour unchanged** — wait-for-critical-images (above-the-fold / `fetchpriority="high"` images, `MAX_WAIT_MS=1500`), `/album` fixed-grace fallback, `/admin*` suppression, popstate handler, the three callsite migrations (Header / GalleryGrid / Projects). See the entry below for the full architecture.

### 2026-05-13 — Page-transition loader (wordmark draw-on + wait-for-critical-images)

Added a global loading screen / page transition. *(Brainstormed via `superpowers:brainstorming`; design-doc + spec-review steps skipped per the user — decisions captured here instead.)*

**Decisions**
- **Wait strategy:** the loader holds until the new page's *above-the-fold or `fetchpriority="high"`* images are decoded, then reveals; below-the-fold images keep lazy-loading. Capped at `MAX_WAIT_MS = 1500ms` so it never hangs. Minimum visible time on in-app navs: `MIN_VISIBLE_MS = 600ms`. `/album` uses a fixed `ALBUM_GRACE_MS = 800ms` grace (the R3F flipbook's textures don't surface as `<img>` elements, so geometry-based detection finds nothing — fine in practice, the textures are local `/public/textures` files).
- **Visual:** full-bleed `bg-stone-200` (matches the body), centred SVG "RK&nbsp;PAI" wordmark whose strokes draw in then cross-fade to a solid letterform, with a hair-thin `red-orange-500` progress bar underneath. Editorial / quiet (option A from the brainstorm — user rejected the cinematic curtain B and the minimal spinner C).
- **Scope:** every in-app navigation between public routes (`/`, `/stories`, `/stories/[id]`, `/album`) AND the initial cold load / direct deep-link. **Excluded:** `/admin*` (utility area). The cross-route hash-anchor links (`/#intro` from non-home pages) stay as hard navs in `Header.tsx` — the SSR'd overlay on the new `/` page covers them, so they participate in the UX without a special code path. Same-page hash scrolls (e.g. clicking "About" while on `/`) skip the loader entirely.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` redefines the keyframes to a no-op (wordmark just appears solid, bar lands at its rest scale) — inline `style.animation: <name>` keeps referencing the same name, so the override sticks without fighting inline-style specificity.

**Files added**
- [src/components/page-transition.ts](src/components/page-transition.ts) — the shared Jotai atom (`pageTransitionAtom`), constants (`MIN_VISIBLE_MS` / `MAX_WAIT_MS` / `ALBUM_GRACE_MS` / `SUPPRESS_PREFIXES = ["/admin"]`), and a `useStartPageTransition()` hook for programmatic navigation. Atom default has `visible: true` so the overlay is in the first paint of a cold load (no flash of unloaded content); SSR and the first client render read the same default so there's no hydration mismatch.
- [src/components/TransitionOverlay.tsx](src/components/TransitionOverlay.tsx) — `"use client"` overlay (`fixed inset-0 z-[100]`), mounted once in `layout.tsx`. Owns the pathname-change watcher (`usePathname()`) that runs `waitForCriticalImages(...)` then dismisses, plus a `popstate` listener for browser back/forward. Returns `null` on `/admin*`. Has a `<noscript>` style override hiding the overlay when JS is off.
- [src/components/TransitionLink.tsx](src/components/TransitionLink.tsx) — drop-in `next/link` wrapper that flips the atom to `visible: true` on click before letting `<Link>` navigate. Skips modifier-key clicks, non-primary mouse buttons, external/`mailto:`/`tel:`, same-pathname hash links, and `/admin*` targets.

**Files modified**
- [src/app/globals.css](src/app/globals.css) — appended `@keyframes rkpai-wordmark-stroke` + `rkpai-bar-grow`, with `prefers-reduced-motion` overrides redefining the same keyframe names.
- [src/app/layout.tsx](src/app/layout.tsx) — mounted `<TransitionOverlay />` inside `<body>` as a sibling of `ConvexClientProvider`.
- [src/sections/Header.tsx](src/sections/Header.tsx) — logo `<Link href="/">` → `<TransitionLink>`; `handleNavigation`'s in-app `router.push(href)` path now calls `startPageTransition(href)` first. The `mailto:`/`tel:` and cross-route hash branches stay as `window.location.href` hard navs.
- [src/components/GalleryGrid.tsx](src/components/GalleryGrid.tsx) — `import Link from "@/components/TransitionLink"` (aliased, so no JSX changes).
- [src/sections/Projects.tsx](src/sections/Projects.tsx) — converted the plain `<a href>` to `<TransitionLink>` (it was a hard nav before; now SPA + gets the transition). Behavior change worth knowing — the home page's "Recent Stories" links used to do a full page reload, now they're SPA.

**Not done / follow-ups**
- Convert the cross-route hash-anchor nav in `Header.tsx` (`/#intro`, `/#projects` from non-home pages) to SPA + a post-arrival programmatic scroll so they participate as in-app transitions instead of hard navs. Works fine as-is via the SSR'd overlay, just not strictly SPA.
- `/album` uses a fixed grace period; if the 3D textures feel slow we can integrate `useProgress()` from `@react-three/drei` and wait until `progress === 100`.
- No "force-hide safety" on popstate to a same-pathname hash (rare edge case where the loader could stick); refresh works around it.

### 2026-05-13 — /stories/[id] page background now matches the home page

The photo-detail page (and its "Photo Not Found" fallback) used a pastel `bg-gradient-to-br from-blue-50 via-green-50 to-purple-50` (plus a layer of blurred blue/purple/green blobs) — out of step with the rest of the site, which is the body's flat `bg-stone-200`. Swapped both wrappers to `bg-stone-200` and removed the decorative-blob `<div>`. Left the white glass content cards (`bg-white/60` etc.) — they read fine on `stone-200`; their unused `dark:` variants are unchanged (see §8). No text-colour changes needed (the page's text is the light-mode `text-gray-{500,700,800}` variants, still readable on a light bg).

### 2026-05-13 — Fixed the header hamburger icon not morphing into an X

Bug (reported on the deployed site): the two-line hamburger in [src/sections/Header.tsx](src/sections/Header.tsx) didn't turn into an X when the menu opened. Cause — it was an `<svg>` with two `<motion.line>`s animating `rotate`/`translateY` with `transformOrigin="center"`. Two compounding problems: (1) for SVG geometry elements `transform-origin` defaults to the *view-box*, not the element's own bounding box (and passing `transformOrigin` as a prop to `motion.line` doesn't reliably set it anyway) — so the lines rotated around the wrong pivot and swung off-canvas instead of crossing; this is browser-dependent (Safari ≠ Chrome), the classic "fine in dev, broken when deployed" shape. (2) `Line` was defined *inside* `Header`, so every re-render gave it a new function identity → React remounted the `<line>`s on each render → framer-motion's animation state was thrown away.

Fix: replaced the SVG/`motion.line` hamburger with the standard two-`<span>`-bar version — plain HTML elements transform around their own centre in every browser/build mode, animated with a CSS `transition` (`ease-in-out` = `cubic-bezier(.4,0,.2,1)`, same as before). Removed the now-unused `Line` component; `motion`/`AnimatePresence`/`useAnimate` are still used by the overlay menu so the import stays. Also: the bars switch `bg-stone-900` → `bg-stone-200` when open (the old SVG stayed `currentColor`/dark and would've been near-invisible on the dark menu overlay), and added `aria-expanded` to the toggle. `tsc --noEmit` clean; **not visually verified here** — confirm on the next deploy that the icon morphs cleanly to a centred X and back.

### 2026-05-13 — Fixed the /album page-flip sound playing on page load

Bug: navigating to `/album` played the page-flip sound immediately, before any page was turned. Cause — [src/components/UI.jsx](src/components/UI.jsx) plays the sound in `useEffect(() => playPageFlipSound(), [page, playPageFlipSound])`, and a `useEffect` always runs once after the first render; since you reach `/album` via an in-app nav click (same document), the browser's autoplay gate is already satisfied, so that mount-run's `audio.play()` succeeds instead of being blocked. Fix: a `didMount` ref guard so the sound only plays on *subsequent* `page` changes, not the initial mount. (The ref resets on unmount, so if you flip to page N, leave `/album`, and come back — `pageAtom` is module-level so the book reappears at page N — no spurious flip sound; correct, since no flip happened. Possible later UX tweak: reset `pageAtom` to 0 when leaving `/album`. Also still unaddressed: `lodash` is in `package.json` only for `UI.jsx`'s `debounce` — could be replaced with a 5-line inline debounce if you ever want `lodash` gone.)

### 2026-05-13 — Fixed the site-nav anchor links ("About" / "Recent Stories" dead on non-home pages)

Bug: in [src/sections/Header.tsx](src/sections/Header.tsx), the menu's "About" (`/#intro`) and "Recent Stories" links did nothing when clicked from any page other than `/`. Root cause — `handleNavigation` only ever did a *same-page* scroll for `/#…` anchors (`getElementById(...)?.scrollIntoView()`, no fallback) and had no "navigate to `/` first" path; it was written when this Header was home-only, but commit `2d7ef03` reused it on `/stories`, `/stories/[id]`, `/album`, where `id="intro"` (in `About.tsx`) and `id="projects"` (in `Projects.tsx`) don't exist. Also "Recent Stories" had a malformed `href` (`#projects`, no leading `/`) so it never hit the `/#` branch — it fell through to `router.push("#projects")`, a relative-hash no-op. (And "Contact"'s `mailto:` was going through `router.push`, which doesn't open a mail client.)

Fix: `handleNavigation` now — (1) routes `mailto:`/`tel:`/`isExternal` through `window.location.href`; (2) for `/#…` anchors, smooth-scrolls if `usePathname() === "/"`, else `window.location.href = "/#…"` so the browser lands on the home page and scrolls to the section (chose a real navigation over `router.push` here so the hash-scroll is guaranteed); (3) plain routes still use `router.push`. Also fixed the `#projects` → `/#projects` href and set Contact's `isExternal: true`. Verified `tsc --noEmit` clean; **not browser-tested here** — confirm: from `/stories`, "About" lands on `/` at the About section and "Recent Stories" at "My Recent Stories"; on `/`, both still smooth-scroll in-page; "Contact" opens the mail client. *(Possible later cleanup: convert the menu items to `<Link>` and drop the bespoke handler — left as a refactor, not a fix.)*

### 2026-05-13 — Cleared the Next 16 dev-server warnings (proxy rename, next/image sizes)

Triaged the warnings the dev server / build were printing after the Next 14→16 modernization:

- **`middleware.ts` → `proxy.ts`** ([src/middleware.ts](src/proxy.ts) → [src/proxy.ts](src/proxy.ts)): Next 16 deprecated the `middleware` file convention in favour of `proxy` ([docs](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)). `proxy.ts` has the same runtime contract — a single default-exported handler + an optional `config` matcher — so `convexAuthNextjsMiddleware(...)` (still that export name; `@convex-dev/auth` v0.0.92 hasn't shipped a `proxy` alias) drops in unchanged. Did the rename by hand (`git mv` + comment tweak), not the `@next/codemod`, since there's no named `function middleware()` to rename — it's `export default convexAuthNextjsMiddleware(...)`. Still must live at `src/proxy.ts` (not repo root) for the same `src/`-dir reason. One semantic difference per the docs: `proxy` defaults to the Node.js runtime (middleware historically defaulted to Edge) — fine for Convex Auth, and the `runtime` segment-config option is *not* allowed in proxy files (we don't set it). Build confirms it's picked up (`ƒ Proxy (Middleware)` in the route table) and the deprecation warning is gone. **Not verified end-to-end here** — re-test the auth flow after this lands: sign in at `/admin/login` → should redirect to `/admin`; hit `/admin` while logged out → should redirect to `/admin/login`; sign-in must still `POST /api/auth` OK. Trivial revert if it misbehaves: `git mv src/proxy.ts src/middleware.ts`.
- **`next/image` `fill` missing `sizes`** — [src/sections/About.tsx](src/sections/About.tsx)'s `rk.jpg` (`fill`, no `sizes`) was the one warning in the console; added `sizes="(max-width: 768px) 100vw, 50vw"` (the image column is `w-full md:w-1/2`). Also cleaned up [src/app/stories/[id]/page.tsx](src/app/stories/[id]/page.tsx): dropped the dead `layout="responsive"` prop (a Next 12 API removed in Next 13 — a no-op now; `width`/`height` + `w-full h-auto` already handles it) and added `sizes="(max-width: 1024px) 100vw, 60vw"` (`lg:col-span-3` of a 5-col grid). `SlideShow.tsx` already had `sizes`; the `width`/`height` images in `GalleryGrid.tsx` / `Projects.tsx` don't warn (left as-is).
- **`THREE.Clock: ... deprecated. Please use THREE.Timer instead.`** — *not our code* and not fixed: it's `@react-three/fiber` v9.6.1 still using `THREE.Clock` internally while `three` ^0.184 deprecates it. Cosmetic browser-console log, no functional impact; goes away when R3F updates. (Could pin `three` to a pre-deprecation release — it'd still satisfy R3F/drei's `>=0.159` peer range — but not worth it.) Likewise `THREE.WebGLRenderer` etc. noise from the `/album` flipbook is upstream.

### 2026-05-13 — Dependency cleanup; removed the one-time Google-Sheet import script

Housekeeping on the `migrate-to-convex` branch (which also carries an in-progress Next 14→16 / React 18→19 / ESLint 8→9-flat-config modernization, not yet logged here).

- **Removed unused deps** (zero imports anywhere in `src/`/`convex/`): `motion` (the code uses `framer-motion`, never `motion` — they're the same lib under two names), `split-type`, `class-variance-authority` (`Button.tsx` uses `tailwind-merge`, not `cva`). The earlier AWS/Prisma vestigial deps (`@prisma/client`, `prisma`, `aws-sdk`, `@aws-sdk/*`) were already gone as part of the modernization.
- **Removed the one-time migration machinery:** deleted `scripts/import-from-sheet.mjs` and the `import:photos` npm script; `pnpm remove googleapis dotenv` (both were used *only* by that script — `googleapis` was a devDep, `dotenv` was a regular dep with no other consumer). The Google-Sheet→Convex import is considered done/not-needed.
- **Kept** `@auth/core` (peerDependency of `@convex-dev/auth` — looks unused to `depcheck`, isn't) and the dual `overrides` / `pnpm.overrides` postcss pins (npm needs the former, pnpm the latter — both lockfiles are still tracked).
- **Both lockfiles re-synced** to the edited `package.json` (`pnpm install` for `pnpm-lock.yaml`, `npm install` for `package-lock.json`, then `pnpm install` again so `node_modules` is in pnpm's layout for dev). Per the user's call, the project keeps both lockfiles for now rather than going pnpm-only.
- **Verified:** `npx tsc --noEmit` clean; `pnpm run build` succeeds (Next 16 / Turbopack, all routes compile). Pre-existing noise unchanged: the `middleware`→`proxy` deprecation warning, 6 npm-audit advisories.
- **Left as a follow-up:** `convex/photos.ts` still has the `migrationToken` escape hatch (`assertAdminOrMigration` + the `migrationToken` arg on `generateUploadUrl`/`create`, matched against `process.env.MIGRATION_TOKEN`). With the import script deleted it's now dead code *and* a latent auth bypass — should be removed (and `MIGRATION_TOKEN` dropped from any deployment). Also a stale `Bash(node --check scripts/import-from-sheet.mjs)` permission lingers in `.claude/settings.local.json`.
- **Also (same session):** added two working-style rules to §0 at the developer's request — *clarify the prompt/commands before implementing* and *state assumptions out loud to the developer* (don't bury them in the diff).

### 2026-05-12 — Unified the site header; wired the photo-detail share button; dropped .env.example

- **One header everywhere (public pages):** `/stories`, `/stories/[id]` (incl. the not-found state), and `/album` now render the same `<Header/>` from [src/sections/Header.tsx](src/sections/Header.tsx) that the home page uses. `/stories` had been using the minimal [src/sections/Nav.tsx](src/sections/Nav.tsx) (now unused, kept). `/admin*` keeps its own bare layout deliberately. `<Header/>` is `fixed top-0`, so the pages that gained it got top padding (`pt-28`/`pt-32`/`pt-36`) to clear it. On `/album` the header renders over the 3D `<Canvas>` alongside the existing `<UI/>` book-control overlay; the dark slate background was swapped for the site's `bg-stone-200`, and the user removed `UI.jsx`'s old "Wildlife Photography" title overlay since the header now covers that role.
- **Share button on `/stories/[id]`:** the previously-decorative `<Share2>` icon in [PhotoClinet.tsx](src/app/stories/[id]/PhotoClinet.tsx) is now a real button — `navigator.share({ title: document.title, url: location.href })` on browsers that support it, otherwise copy the URL to the clipboard and show a transient "Link copied" badge. User-dismissed native-share (`AbortError`) is swallowed. Scope was intentionally limited to the detail page (the gallery cards were left alone).
- **Removed `.env.example`** from the repo per the user — env vars are documented in §5 instead. CONTEXT §0 now says not to re-add one.

### 2026-05-12 — Created the sole admin account; disabled sign-up; password show/hide toggle

- **Admin account created:** `rkpai@gmail.com` (on the dev deployment `dependable-robin-568`), via a new one-time `internalAction` [convex/setup.ts](convex/setup.ts) `createAdmin({ email, password })` that calls `createAccount` from `@convex-dev/auth/server`. The password is an argument — never stored in source, env, or this doc. Run as `npx convex run setup:createAdmin '{"email":"...","password":"..."}'`. (Re-runs are safe — "already exists" is caught.)
- **`ADMIN_EMAILS=rkpai@gmail.com`** set on the deployment — that single email is the only one allowed to write photos.
- **Sign-up disabled two ways:** (1) [src/app/admin/login/page.tsx](src/app/admin/login/page.tsx) is sign-in-only now — the "create account" toggle/flow is gone; (2) server-side backstop in [convex/auth.ts](convex/auth.ts): `Password({ profile })` throws on `flow === "signUp"` unless the email is on `ADMIN_EMAILS`. `createAccount` (the setup path) bypasses that gate by design.
- **Convex Auth env vars set on the deployment** via `npx @convex-dev/auth --web-server-url http://localhost:3000 --skip-git-check` (it detected the existing code files and only set vars — didn't clobber the customized `auth.ts`): `JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL=http://localhost:3000`. **Production needs these set separately** (`SITE_URL` = the prod URL) — `npx @convex-dev/auth --prod`.
- **Password field show/hide (eye) toggle** added to the login form (`lucide-react` `Eye`/`EyeOff` — already a dep).
- *Note:* this configured the **dev** deployment. For prod: `npx convex env set ADMIN_EMAILS ...`, `npx @convex-dev/auth --prod`, and run `setup:createAdmin` against prod (`npx convex run --prod setup:createAdmin '{...}'`).
- *Bug fixed:* `middleware.ts` was initially placed at the repo root, but this project uses a `src/` dir, so Next.js looks for `src/middleware.ts` and silently ignored the root one — `/admin` wasn't gated and `POST /api/auth` 404'd, so the browser sign-in failed even though `auth:signIn` worked fine when called directly. Moved to `src/middleware.ts`.
- *Heads-up for the next session:* a `pnpm run build` was started here and OOM-killed mid-run after `rm -rf .next`, which can leave a half-written `.next/` under a running `pnpm run dev` → "weird errors" until `pnpm run dev` is restarted. Don't run `pnpm run build` while `next dev` is up.

### 2026-05-12 — Hardened `/admin` auth: replaced the shared-secret flow with Convex Auth

Follow-up to the two entries below — the "shared secret typed in the browser" model was flagged as weak, so it's gone. `/admin` now uses **Convex Auth** (email + password) with the Next.js integration, and *authorization* to write photos is a separate `ADMIN_EMAILS` allow-list on the deployment. No application secret ever touches the browser.

- **Deps:** `@convex-dev/auth` ^0.0.92 + `@auth/core` 0.37.0 (the auth lib pins `@auth/core` to that exact version).
- **Convex backend:** `convex/auth.ts` (`convexAuth({ providers: [Password] })`), `convex/auth.config.ts` (JWT config, `domain = CONVEX_SITE_URL`), `convex/http.ts` (`auth.addHttpRoutes`), and `...authTables` spread into `convex/schema.ts` (adds `users`, `authSessions`, `authAccounts`, …).
- **`convex/photos.ts` rewrite:** dropped `verifyAdmin` and every `adminSecret` arg / the `assertAdmin(secret: string)` helper. New `assertAdmin(ctx)` = `getAuthUserId(ctx)` must resolve **and** that user's `email` must be in `process.env.ADMIN_EMAILS` (comma-separated). Mutations call it; reads (`list`, `getBySlug`) stay public. **Escape hatch:** `generateUploadUrl` + `create` also accept an optional `migrationToken` checked against `process.env.MIGRATION_TOKEN` — a deliberately narrow, time-boxed bypass used **only** by `scripts/import-from-sheet.mjs` (set `MIGRATION_TOKEN` for the import, then `npx convex env remove MIGRATION_TOKEN`). Not on `update`/`remove`/`reorder`.
- **Next.js wiring:** `middleware.ts` = `convexAuthNextjsMiddleware` that redirects `/admin*` → `/admin/login` when unauthenticated and `/admin/login` → `/admin` when authenticated; matcher covers `/api/auth/*` so the middleware can proxy Convex Auth's HTTP routes (no Next.js route handler needed). Root `layout.tsx` wraps in `<ConvexAuthNextjsServerProvider>`; `ConvexClientProvider.tsx` now uses `ConvexAuthNextjsProvider` over a `ConvexReactClient`.
- **Admin pages:** new `src/app/admin/login/page.tsx` (email+password sign-in via `useAuthActions().signIn("password", { email, password, flow })`, with a "create account" toggle for first setup). `src/app/admin/page.tsx` rewritten — `<AuthLoading>/<Unauthenticated>/<Authenticated>` (`convex/react`) wrapper, Sign-out via `useAuthActions().signOut()`, mutation calls no longer pass any secret. The whole `SECRET_KEY`/`localStorage`/`verifyAdmin` mechanism is deleted.
- **Import script + `.env.example`:** the script now passes `migrationToken: process.env.MIGRATION_TOKEN` instead of `adminSecret`; comments/prereqs updated. `.env.example` documents the new vars (`ADMIN_EMAILS` on Convex env; `MIGRATION_TOKEN` only for the import).
- **Decisions / trade-offs:**
  - *Authorization separate from authentication:* signed-in ≠ allowed. The `ADMIN_EMAILS` allow-list is the real gate, so a stray account created via the Password provider's sign-up flow can't touch photos. Could disable signup / add email verification later — left in for first-account creation.
  - *`migrationToken` hatch:* the import runs from a script with no browser session, so it needs *some* server-trusted credential. An env-var token scoped to two mutations, removed right after the one-time import, is the standard pattern for one-off admin scripts — not a long-lived app secret. Documented to be removed.
  - *Session JWT in `localStorage`:* `ConvexAuthNextjsProvider` defaults to `storage: "localStorage"`. That's a short-lived, revocable JWT (not a password) and the standard setup; httpOnly cookies are used server-side by the middleware. `storage: "inMemory"` is available if wanted (costs cross-tab sync + survives-refresh). Left at the default.
  - *Everything is now `ƒ` (dynamic):* the server auth provider reads cookies in the root layout + middleware runs everywhere → no static prerendering. Negligible for this site; the photo pages were `force-dynamic` anyway.
- **Status:** code-complete, `pnpm run build` clean (lint clean except the pre-existing `typewriter-effect.tsx` warning). **Not verified end-to-end** — couldn't run the auth flow here. Before it works: run `npx @convex-dev/auth` (sets `JWT_PRIVATE_KEY`/`JWKS`/`SITE_URL` on the deployment), `npx convex env set ADMIN_EMAILS ...`, then create the admin account at `/admin/login`. `convex/_generated/` was regenerated against the new schema/functions (a `convex dev` appears to be running in this environment).
- **Open follow-ups:** remove `MIGRATION_TOKEN` after the data import; consider `storage: "inMemory"` if the `localStorage` JWT bothers you; consider email verification on the Password provider; admin reorder UI (the `reorder` mutation has no UI yet). *(Sign-up has since been disabled and the admin account created — see the entry above.)*

### 2026-05-12 — Security rule added to §0; `/admin` auth weakness flagged

- Added a hard "Security is non-negotiable" rule to §0: never put secrets in source, never expose secrets to the client (`NEXT_PUBLIC_*` is public), authorize server-side with least privilege, flag anything that weakens this. Triggered by review feedback on the Convex migration.
- Clarified for the record: the migration does **not** hardcode any secret — `ADMIN_SECRET` is read from `process.env` in `convex/photos.ts` / the import script, and `.env.example` ships empty placeholders. (`SECRET_KEY = "rkpai_admin_secret"` in `src/app/admin/page.tsx` is just the `localStorage` *key name*, not a secret value.)
- But the `/admin` auth *flow* is genuinely weak for strict production (secret typed in-browser → `localStorage` → sent as a plaintext arg to a public, unthrottled `verifyAdmin` query). Documented the proper fix (Convex Auth / server-side session). **→ Implemented in the entry above (Convex Auth) the same day.**

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

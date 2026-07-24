"use client";

// Tile grid for the landing page, branching by viewport:
//
//   MOBILE (<md, <768px): one static photo per tile, no rotation. Mobile has
//     a tight CPU/bandwidth budget and on fast scroll the old auto-crossfade
//     caused two visible problems — frame drops while scrolling (4 setInterval
//     timers + 12 mounted <Image> elements + setState every 5s) and images
//     "missing then popping in" (next/image's IntersectionObserver firing only
//     after the tile was already on-screen). Showing one photo per tile drops
//     us to 4 <Image>s with no timers, and tiles 1–3 are eager-loaded so they
//     don't pop in on scroll.
//
//   TABLET / DESKTOP (md+, ≥768px): the staggered opacity crossfade through
//     all the tile's slides. All slides for a tile stay mounted as
//     absolute-positioned siblings; only their opacity flips, so the next
//     image is already decoded before becoming visible — the original "gray
//     placeholder" fix from b5c59e2.
//
// Photos come from the Convex-backed `photos` prop (round-robin across 4
// tiles for variety); falls back to /public/images/birdN.jpg when no photos
// are available (fresh deploy / build before `convex dev`).

import Image from "next/image";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { MorphingText } from "@/components/ui/morphing-text";
import type { Photo } from "@/lib/photo";

const MORPHING_TEXTS = [
  "Vision",
  "Lens",
  "Capture",
  "Focus",
  "Essence",
  "Glimpse",
];

/** How long each slide stays fully visible before the crossfade starts. */
const SLIDE_MS = 5000;
/** Per-tile phase offset — tiles start their rotation 1.25s apart. */
const STAGGER_MS = 1250;

type Slide = { src: string; alt: string; caption?: string; blurDataURL?: string };
type Tile = { position: "up" | "down"; slides: Slide[] };

/** Static fallback used when no Convex photos are available (build before
 *  convex dev / empty gallery). Files live in /public/images. */
const FALLBACK_TILES: Tile[] = [
  {
    position: "up",
    slides: [
      { src: "/images/bird1.jpg", alt: "Woodland Wonders", caption: "Capturing avian life in forest settings" },
      { src: "/images/bird2.jpg", alt: "Woodland Wonders", caption: "Capturing avian life in forest settings" },
      { src: "/images/bird3.jpg", alt: "Woodland Wonders", caption: "Capturing avian life in forest settings" },
    ],
  },
  {
    position: "down",
    slides: [
      { src: "/images/bird4.jpg", alt: "Wetland Residents", caption: "Intimate moments of water-dwelling birds" },
      { src: "/images/bird5.jpg", alt: "Wetland Residents", caption: "Intimate moments of water-dwelling birds" },
      { src: "/images/bird6.jpg", alt: "Wetland Residents", caption: "Intimate moments of water-dwelling birds" },
    ],
  },
  {
    position: "up",
    slides: [
      { src: "/images/bird7.jpg", alt: "Migratory Journeys", caption: "Birds in flight across vast landscapes" },
      { src: "/images/bird8.jpg", alt: "Migratory Journeys", caption: "Birds in flight across vast landscapes" },
      { src: "/images/bird9.jpg", alt: "Migratory Journeys", caption: "Birds in flight across vast landscapes" },
    ],
  },
  {
    position: "down",
    slides: [
      { src: "/images/bird10.jpg", alt: "Urban Dwellers", caption: "Birds adapting to city environments" },
      { src: "/images/bird11.jpg", alt: "Urban Dwellers", caption: "Birds adapting to city environments" },
      { src: "/images/bird12.jpg", alt: "Urban Dwellers", caption: "Birds adapting to city environments" },
    ],
  },
];

function truncate(s: string, max: number): string {
  return s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Round-robin photos across N tiles so each tile gets a variety, not a
 *  sequential clump. (Tile 0 = photos 0, 4, 8; tile 1 = photos 1, 5, 9; …) */
function buildTilesFromPhotos(photos: Photo[], tileCount = 4): Tile[] {
  const usable = photos.filter((p) => p.src || p.image_url);
  if (usable.length < tileCount) return FALLBACK_TILES;

  const buckets: Slide[][] = Array.from({ length: tileCount }, () => []);
  usable.forEach((p, i) => {
    buckets[i % tileCount].push({
      src: p.src || p.image_url,
      alt: p.alt || "Wildlife photograph",
      caption: p.location || (p.story ? truncate(p.story, 80) : undefined),
      blurDataURL: p.blurDataURL,
    });
  });

  // A tile with one slide doesn't rotate — fine for very small photo sets.
  return buckets.map((slides, i) => ({
    position: i % 2 === 0 ? "up" : "down",
    slides,
  }));
}

const MEDIA_QUERY = "(min-width: 768px)";

/**
 * Returns `true` once the viewport is at the md+ breakpoint (≥768px).
 * `useSyncExternalStore` is the React-blessed way to subscribe to an external
 * store like `matchMedia` — the alternative (useState + useEffect with
 * setState) trips the React Compiler's `react-hooks/set-state-in-effect`
 * rule. The server snapshot is `false` so SSR + first client render agree
 * (no hydration mismatch); on desktop it flips to true after hydration,
 * causing one re-render that mounts the crossfade-only slides.
 */
function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(MEDIA_QUERY);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia(MEDIA_QUERY).matches,
    () => false,
  );
}

function FadeTile({
  tile,
  tileIndex,
  priority,
  isDesktop,
}: {
  tile: Tile;
  tileIndex: number;
  priority: boolean;
  isDesktop: boolean;
}) {
  // Mobile mounts only the first slide; desktop mounts all of them as the
  // crossfade stack. Cutting the mount count by ~3× is the single biggest
  // mobile win — fewer <Image> components for React to reconcile, fewer
  // requests, less decode work during fast scroll.
  const slides = isDesktop ? tile.slides : tile.slides.slice(0, 1);
  const [idx, setIdx] = useState(0);
  const count = slides.length;

  // Rotate, staggered per-tile — DESKTOP ONLY. On mobile there's nothing to
  // rotate to (only slide 0 is mounted) and we explicitly don't want a 5-second
  // setInterval running per tile while the user scrolls.
  useEffect(() => {
    if (!isDesktop || count <= 1) return;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const startId = window.setTimeout(() => {
      setIdx((i) => (i + 1) % count);
      intervalId = setInterval(() => {
        setIdx((i) => (i + 1) % count);
      }, SLIDE_MS);
    }, SLIDE_MS + STAGGER_MS * tileIndex);

    return () => {
      window.clearTimeout(startId);
      if (intervalId !== undefined) clearInterval(intervalId);
    };
  }, [isDesktop, count, tileIndex]);

  // Idle-preload non-priority slides — DESKTOP ONLY. The whole point of this
  // belt is to warm the cache before the first crossfade; mobile has no
  // crossfade so there's nothing to warm.
  useEffect(() => {
    if (!isDesktop || tile.slides.length <= 1) return;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const w = window as IdleWindow;
    const ric =
      w.requestIdleCallback ??
      ((cb: () => void) => window.setTimeout(cb, 1500));
    const cic = w.cancelIdleCallback ?? window.clearTimeout;
    const handle = ric(() => {
      tile.slides.slice(1).forEach((slide) => {
        const img = new window.Image();
        img.src = slide.src;
      });
    });
    return () => cic(handle as number);
  }, [isDesktop, tile.slides]);

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl shadow-xl bg-stone-300 h-[420px] sm:h-[500px] lg:h-[600px] ${
        tile.position === "down" ? "md:mt-12 lg:mt-24" : ""
      } md:transition-transform md:duration-500 md:ease-out md:hover:scale-[1.02]`}
    >
      {slides.map((slide, i) => {
        // priority on tile 0 / slide 0 (LCP). For the remaining mobile tiles
        // (1–3) — which are below the fold on first paint but the user will
        // scroll through within a couple of viewports — set loading="eager" so
        // they start fetching alongside the page rather than waiting for an
        // IntersectionObserver hit during fast scroll. Desktop non-priority
        // slides keep next/image's default lazy + our idle-preload belt.
        const isLcp = priority && i === 0;
        const mobileEager = !isDesktop && !isLcp;
        return (
          <div
            key={slide.src}
            aria-hidden={i !== idx}
            className={`absolute inset-0 ${
              isDesktop
                ? `transition-opacity ease-out duration-[1200ms] ${
                    i === idx ? "opacity-100" : "opacity-0"
                  }`
                : ""
            }`}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={isLcp}
              loading={mobileEager ? "eager" : undefined}
              placeholder={slide.blurDataURL ? "blur" : "empty"}
              blurDataURL={slide.blurDataURL}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 text-white">
              <h2 className="text-lg md:text-xl font-medium">{slide.alt}</h2>
              {slide.caption && (
                <p className="text-xs md:text-sm opacity-80 mt-1 line-clamp-2">
                  {slide.caption}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {/* Subtle hover dim layered above the slides — hover-only, so mobile
          doesn't pay for it. */}
      <div className="absolute inset-0 bg-black/10 md:group-hover:bg-black/0 transition-colors duration-500 pointer-events-none" />
    </div>
  );
}

interface SlideShowProps {
  photos?: Photo[];
}

export default function SlideShow({ photos }: SlideShowProps) {
  const isDesktop = useIsDesktop();
  const tiles = useMemo(
    () => buildTilesFromPhotos(photos ?? []),
    [photos],
  );

  return (
    <section className="relative w-full pt-20 p-4 md:p-8">
      <div className="relative max-w-[1600px] mx-auto">
        <h1 className="text-4xl mt-5 md:text-6xl text-center text-slate-900 mb-16 tracking-tight">
          <MorphingText texts={MORPHING_TEXTS} />
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 lg:gap-16">
          {tiles.map((tile, i) => (
            <FadeTile
              key={i}
              tile={tile}
              tileIndex={i}
              priority={i === 0}
              isDesktop={isDesktop}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

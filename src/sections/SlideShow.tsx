"use client";

// Auto-rotating tile grid for the landing page. Four columns, each
// cross-fading through a small set of photos with a staggered cadence so they
// don't all flip in lockstep. Pulls from the Convex-backed `photos` prop and
// falls back to the hard-coded /public/images/birdN.jpg set when the prop is
// empty (fresh deploy, or a build before `convex dev` has run).
//
// Why CSS opacity instead of AnimatePresence: the previous implementation
// re-mounted the <Image> on every index change (key={src} inside
// AnimatePresence). next/image then re-started its decode from scratch, and
// during the transition the bg-stone-200 site background leaked through the
// dim overlay — that was the "gray placeholder" bug. Here all slides stay
// mounted as absolutely-positioned siblings; only their opacity flips, so the
// next image is already decoded before it becomes the visible one.

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

type Slide = { src: string; alt: string; caption?: string };
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
    });
  });

  // A tile with one slide doesn't rotate — fine for very small photo sets.
  return buckets.map((slides, i) => ({
    position: i % 2 === 0 ? "up" : "down",
    slides,
  }));
}

function FadeTile({
  tile,
  tileIndex,
  priority,
}: {
  tile: Tile;
  tileIndex: number;
  priority: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const count = tile.slides.length;

  // Rotate, staggered per-tile. The first tile starts after SLIDE_MS, each
  // subsequent tile is offset by STAGGER_MS so they don't all flip together.
  useEffect(() => {
    if (count <= 1) return;
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
  }, [count, tileIndex]);

  // Warm the cache for the non-priority slides on idle so the first crossfade
  // isn't the first time the browser has seen those bytes. next/image will
  // also lazy-load them once the tile enters the viewport — this is a belt
  // for the slow-connection case.
  useEffect(() => {
    if (typeof window === "undefined" || count <= 1) return;
    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (h: number) => void;
    };
    const w = window as IdleWindow;
    const ric = w.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const cic = w.cancelIdleCallback ?? window.clearTimeout;
    const handle = ric(() => {
      tile.slides.slice(1).forEach((slide) => {
        const img = new window.Image();
        img.src = slide.src;
      });
    });
    return () => cic(handle as number);
  }, [tile.slides, count]);

  return (
    <div
      className={`relative group overflow-hidden rounded-2xl shadow-xl bg-stone-300 h-[420px] sm:h-[500px] lg:h-[600px] ${
        tile.position === "down" ? "md:mt-12 lg:mt-24" : ""
      } transition-transform duration-500 ease-out hover:scale-[1.02]`}
    >
      {tile.slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== idx}
          className={`absolute inset-0 transition-opacity ease-out duration-[1200ms] ${
            i === idx ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            priority={priority && i === 0}
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
      ))}
      {/* Subtle hover dim layered above the slides. */}
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 pointer-events-none" />
    </div>
  );
}

interface SlideShowProps {
  photos?: Photo[];
}

export default function SlideShow({ photos }: SlideShowProps) {
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
            />
          ))}
        </div>
      </div>
    </section>
  );
}

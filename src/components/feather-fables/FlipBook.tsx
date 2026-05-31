"use client";

// Thin wrapper around the vanilla `page-flip` (StPageFlip) library — chosen over
// `react-pageflip` because page-flip has zero deps / no React peer and is safe
// under React 19 + Turbopack. Loaded via next/dynamic(ssr:false) from the reader.
//
// HTML mode (loadFromHTML): page-flip drives real <img> page nodes, so pages
// stay crisp at any device-pixel-ratio (canvas mode was soft on retina). Init is
// deferred to an rAF and cancelled in cleanup so React StrictMode's
// mount→cleanup→mount double-invoke never consumes the page shells twice (that
// caused a `setDensity` crash) — only the final effect initializes.
//
// Windowed loading: pages near the current one get the full image; the rest hold
// the ~5-15KB thumb (swapped in on flip), so the reader doesn't fetch the whole
// book up front.

import { useEffect, useRef, useState } from "react";
import { PageFlip } from "page-flip";
import type { Book } from "@/data/books";
import { pageUrl, thumbUrl } from "@/data/books";
import { useIsDesktop } from "@/hooks/useIsDesktop";

const MAX_PAGE_WIDTH = 1100; // must match the PageFlip maxWidth below

export type FlipApi = {
  next: () => void;
  prev: () => void;
  turnTo: (page1: number) => void; // 1-based
};

type Props = {
  book: Book;
  initialPage: number; // 1-based
  onPageChange: (page1: number) => void; // 1-based
  onInit: (api: FlipApi, total: number) => void;
};

const WINDOW_BACK = 2;
const WINDOW_FWD = 3;
const clamp = (n: number, lo: number, hi: number) =>
  Math.min(Math.max(n, lo), hi);

export default function FlipBook({ book, initialPage, onPageChange, onInit }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const isDesktop = useIsDesktop();

  // Lock the container to the exact book aspect (two-page spread on desktop,
  // single page on mobile) so page-flip initializes with NO vertical slack.
  // Without this, the spread is width-fit (short) inside a full-height block,
  // and the hard-cover flip rotates using the *block* height — ballooning the
  // cover taller and lurching it upward, then snapping back. Hugging the pages
  // moves the centering whitespace outside the flip surface where it's inert.
  const pagesAcross = isDesktop ? 2 : 1;
  const frameAspect = book.aspect * pagesAcross;
  const frameMaxWidth = MAX_PAGE_WIDTH * pagesAcross;

  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const onInitRef = useRef(onInit);
  onInitRef.current = onInit;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let pf: PageFlip | null = null;
    let cancelled = false;

    // Pages within the window load the full image; the rest keep the thumb.
    // Direct DOM writes — page-flip owns these nodes, no React reconciliation.
    const applyWindow = (current0: number) => {
      const imgs = el.querySelectorAll<HTMLImageElement>("img.ff-img");
      imgs.forEach((img, i) => {
        const inWindow = i >= current0 - WINDOW_BACK && i <= current0 + WINDOW_FWD;
        const want = inWindow ? pageUrl(book, i + 1) : thumbUrl(book, i + 1);
        if (img.getAttribute("src") !== want) img.setAttribute("src", want);
      });
    };

    // Defer one frame: StrictMode's synchronous cleanup cancels this before the
    // throw-away first mount initializes; only the real mount runs init.
    const raf = requestAnimationFrame(() => {
      if (cancelled) return;
      const start0 = clamp(initialPage - 1, 0, book.pageCount - 1);

      pf = new PageFlip(el, {
        width: book.pageWidth,
        height: book.pageHeight,
        size: "stretch",
        minWidth: 380, // portrait↔landscape switches at ~2×minWidth (≈760px)
        maxWidth: 1100, // per single page → landscape spread caps at ~2200
        minHeight: Math.round(380 / book.aspect),
        maxHeight: Math.round(1100 / book.aspect),
        drawShadow: true,
        flippingTime: 700,
        maxShadowOpacity: 0.5,
        showCover: true,
        usePortrait: true, // allow auto single-page on narrow screens
        mobileScrollSupport: false,
        clickEventForward: false,
        autoSize: true,
        startPage: start0,
      });

      applyWindow(start0); // full-res opening spread before page-flip binds nodes
      pf.loadFromHTML(el.querySelectorAll<HTMLElement>(".ff-page"));

      pf.on("flip", (e) => {
        const cur0 = e.data as number;
        applyWindow(cur0);
        onPageChangeRef.current(cur0 + 1);
      });
      pf.on("changeOrientation", () => {
        if (pf) applyWindow(pf.getCurrentPageIndex());
      });

      onInitRef.current(
        {
          next: () => pf?.flipNext(),
          prev: () => pf?.flipPrev(),
          turnTo: (page1) => pf?.flip(clamp(page1 - 1, 0, book.pageCount - 1)),
        },
        book.pageCount,
      );
      onPageChangeRef.current(start0 + 1);
      setReady(true);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      pf?.destroy();
    };
    // Mount-once: page-flip handles resize + orientation internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // overflow-hidden clips the briefly-stacked page shells before page-flip
  // arranges them (rendered at opacity 0 until ready). aspectRatio hugs the
  // pages so there's no vertical slack for the cover flip to balloon into;
  // max-h-full keeps it inside the stage on short/wide viewports.
  return (
    <div
      ref={containerRef}
      className="ff-book mx-auto w-full max-h-full overflow-hidden"
      style={{
        aspectRatio: String(frameAspect),
        maxWidth: frameMaxWidth,
        opacity: ready ? 1 : 0,
        transition: "opacity 300ms ease",
      }}
    >
      {Array.from({ length: book.pageCount }, (_, i) => {
        const n = i + 1;
        // Soft density everywhere — including the cover. A "hard" cover flips as
        // a rigid rotation that page-flip renders taller than the flat page,
        // producing an abrupt upward lurch on open; soft gives the same smooth
        // page-bend the interior turns use.
        return (
          <div key={n} className="ff-page" data-density="soft">
            <img
              className="ff-img"
              alt={`${book.title} — page ${n}`}
              draggable={false}
              loading="lazy"
              decoding="async"
            />
          </div>
        );
      })}
    </div>
  );
}

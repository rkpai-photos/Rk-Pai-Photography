"use client";

// Full-bleed loader overlay — option B "Curtain wipe" (see CONTEXT.md §11).
// Two stone-900 panels close from top and bottom over the page, the brand
// (RK PAI / PHOTOGRAPHY) sits between them while the next page loads behind,
// then they slide apart to reveal. Mounted once in src/app/layout.tsx, sits
// above everything (z-[100]) and:
//
//   • on cold load: rendered closed via the atom default (so it's in the
//     first paint, no flash of unloaded content); slides open once critical
//     images are decoded.
//   • on in-app nav: <TransitionLink>/`useStartPageTransition` flips `visible`
//     to true on click — panels slide in (close), wait-for-images runs once
//     the new route mounts, then panels slide out (open).
//   • on /admin*: returns null entirely.
//
// The visual is driven by `transition: transform …` on the panels (no @keyframes
// remounting tricks) — state.visible flipping in either direction naturally
// triggers the close or open animation.

import Image from "next/image";
import { useAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  pageTransitionAtom,
  isSuppressedPath,
  MIN_VISIBLE_MS,
  MAX_WAIT_MS,
  ALBUM_GRACE_MS,
} from "./page-transition";

export default function TransitionOverlay() {
  const pathname = usePathname();
  const [state, setState] = useAtom(pageTransitionAtom);
  const prevPathname = useRef<string | null>(null);

  // Pathname watcher: on cold load (first run) AND every in-app pathname
  // change, run the wait-for-critical-images routine and then dismiss.
  useEffect(() => {
    if (isSuppressedPath(pathname)) {
      if (state.visible) setState((s) => ({ ...s, visible: false }));
      prevPathname.current = pathname;
      return;
    }

    const isFirstRun = prevPathname.current === null;
    const pathChanged = !isFirstRun && prevPathname.current !== pathname;
    prevPathname.current = pathname;
    if (!isFirstRun && !pathChanged) return;
    if (!state.visible) return;

    let cancelled = false;
    const startedAt = state.startedAt || 0;

    waitForCriticalImages(pathname).then(() => {
      if (cancelled) return;
      const elapsed = startedAt === 0 ? Infinity : Date.now() - startedAt;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        if (!cancelled) setState((s) => ({ ...s, visible: false }));
      }, remaining);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // popstate (browser back/forward): re-close the curtain.
  useEffect(() => {
    const onPop = () => {
      if (isSuppressedPath(window.location.pathname)) return;
      setState((s) => ({
        visible: true,
        transitionId: s.transitionId + 1,
        startedAt: Date.now(),
      }));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [setState]);

  if (isSuppressedPath(pathname)) return null;

  // Both panels share the same easing and duration; close and open just go in
  // opposite directions. cubic-bezier(.65,0,.35,1) is an ease-in-out cubic —
  // smoother than the snappy expo we shipped first.
  const easing =
    "transform 550ms cubic-bezier(0.65, 0, 0.35, 1)";

  return (
    <div
      className={`rkpai-transition-overlay fixed inset-0 z-[100] ${
        state.visible ? "pointer-events-auto" : "pointer-events-none"
      }`}
      aria-hidden={!state.visible}
      role="status"
      aria-live="polite"
    >
      {/* No-JS fallback: hide the overlay so the page is usable without JS. */}
      <noscript>
        <style>{`.rkpai-transition-overlay { display: none !important; }`}</style>
      </noscript>
      <span className="sr-only">Loading</span>

      {/* Top panel — closes from above, the "RK Pai" wordmark image (white,
          reads on the stone-900 panel) anchored just above the seam. Width is
          fluid (clamp on vw) so it shrinks on small screens. */}
      <div
        className="rkpai-transition-panel absolute top-0 left-0 w-full h-1/2 bg-stone-900 flex items-end justify-center pb-4 md:pb-6"
        style={{
          transform: state.visible ? "translateY(0)" : "translateY(-100%)",
          transition: easing,
          willChange: "transform",
        }}
      >
        <Image
          src="/rkp.png"
          alt="RK Pai"
          width={1264}
          height={610}
          priority
          sizes="(max-width: 768px) 55vw, 28rem"
          className="h-auto w-[clamp(11rem,46vw,28rem)]"
        />
      </div>

      {/* Bottom panel — closes from below; the "Photography" script wordmark
          image sits just below the seam, rendered at the same fluid width as
          "RK Pai" above so the two lock up as one logo across the seam. */}
      <div
        className="rkpai-transition-panel absolute bottom-0 left-0 w-full h-1/2 bg-stone-900 flex items-start justify-center pt-4 md:pt-6"
        style={{
          transform: state.visible ? "translateY(0)" : "translateY(100%)",
          transition: easing,
          willChange: "transform",
        }}
      >
        <Image
          src="/rkp1.png"
          alt="Photography"
          width={1264}
          height={559}
          priority
          sizes="(max-width: 768px) 55vw, 28rem"
          className="h-auto w-[clamp(11rem,46vw,28rem)]"
        />
      </div>
    </div>
  );
}

/**
 * Wait for the new page's critical images (above-the-fold or fetchpriority=
 * "high") to decode, capped at {@link MAX_WAIT_MS} so we never hang. For
 * /album, fall back to a fixed grace period (the 3D textures don't surface
 * as <img>).
 */
async function waitForCriticalImages(
  pathname: string | null | undefined,
): Promise<void> {
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => resolve()),
  );

  if (pathname?.startsWith("/album")) {
    await new Promise<void>((resolve) =>
      window.setTimeout(resolve, ALBUM_GRACE_MS),
    );
    return;
  }

  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const critical = imgs.filter((img) => {
    if (img.getAttribute("fetchpriority") === "high") return true;
    const rect = img.getBoundingClientRect();
    return rect.top < vh && rect.bottom > 0 && rect.left < vw && rect.right > 0;
  });

  if (critical.length === 0) {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 200));
    return;
  }

  const decodes = critical.map((img) => {
    if (img.complete && img.naturalWidth > 0) return Promise.resolve();
    if (typeof img.decode === "function") {
      return img.decode().catch(() => undefined);
    }
    return new Promise<void>((resolve) => {
      img.addEventListener("load", () => resolve(), { once: true });
      img.addEventListener("error", () => resolve(), { once: true });
    });
  });

  await Promise.race([
    Promise.allSettled(decodes),
    new Promise<void>((resolve) => window.setTimeout(resolve, MAX_WAIT_MS)),
  ]);
}

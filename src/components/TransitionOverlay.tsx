"use client";

// Full-bleed loader overlay (option A "Wordmark draw-on" — see the brainstorm
// log in CONTEXT.md §11). Mounted once in src/app/layout.tsx, sits above
// everything (z-[100]) and:
//
//   • on cold load: rendered visible via the atom default (so it's in the
//     first paint, no flash of unloaded content), then dismisses itself once
//     critical images are decoded.
//   • on in-app nav: <TransitionLink>/`useStartPageTransition` flips `visible`
//     to true on click; the pathname watcher in this file runs the same
//     wait-for-images routine once the new route mounts.
//   • on /admin*: returns null entirely — the admin dashboard doesn't get the
//     transition treatment.

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
      // Admin routes — ensure the loader isn't lingering visible.
      if (state.visible) setState((s) => ({ ...s, visible: false }));
      prevPathname.current = pathname;
      return;
    }

    const isFirstRun = prevPathname.current === null;
    const pathChanged = !isFirstRun && prevPathname.current !== pathname;
    prevPathname.current = pathname;
    if (!isFirstRun && !pathChanged) return;
    if (!state.visible) return; // already hidden — nothing to dismiss

    let cancelled = false;
    // startedAt = 0 on cold load → MIN_VISIBLE_MS floor doesn't apply (the
    // wait-for-images itself provides the visible time). On in-app navs,
    // <TransitionLink> sets startedAt = Date.now() so the floor kicks in.
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
    // We deliberately want this to run on pathname change only — the state
    // values it reads are snapshots at the moment of nav, not reactive deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // popstate (browser back/forward): re-show the loader. The pathname
  // watcher above then handles the rest once Next swaps routes.
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

  return (
    <div
      className={`rkpai-transition-overlay fixed inset-0 z-[100] bg-stone-200 flex items-center justify-center transition-opacity duration-200 ease-out ${
        state.visible ? "opacity-100" : "opacity-0 pointer-events-none"
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

      {/* `key` bumps each transition so the SVG + bar remount and the CSS
          animations replay. */}
      <div key={state.transitionId} className="w-full max-w-md px-8">
        <svg viewBox="0 0 200 50" className="w-full h-auto" aria-hidden="true">
          <text
            x="100"
            y="36"
            textAnchor="middle"
            className="fill-stone-900 stroke-stone-900"
            style={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontSize: 28,
              strokeWidth: 0.5,
              // Initial = hidden (full dashoffset, no fill). Keyframes draw
              // the stroke, then cross-fade to a solid fill. With `forwards`
              // the final state matches: dashoffset=0, fillOpacity=1,
              // strokeOpacity=0 — wordmark sits as a solid letterform.
              strokeDasharray: 600,
              strokeDashoffset: 600,
              fillOpacity: 0,
              strokeOpacity: 1,
              animation:
                "rkpai-wordmark-stroke 850ms ease-in-out forwards",
            }}
          >
            RK PAI
          </text>
        </svg>
        <div className="mt-3 h-px w-full bg-stone-900/15 overflow-hidden">
          <div
            className="h-full bg-red-orange-500 origin-left"
            style={{
              transform: "scaleX(0)",
              animation:
                "rkpai-bar-grow 1500ms cubic-bezier(0.15, 0.6, 0.3, 0.95) forwards",
            }}
          />
        </div>
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
  // One animation frame so the new route gets a chance to render its DOM
  // before we scan it.
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
    // Brief settle so the wordmark animation is visible.
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

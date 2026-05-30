"use client";

// Shared state + constants for the page-transition loader. The loader's visual
// (<TransitionOverlay/>) and the link wrapper that triggers it (<TransitionLink/>,
// plus `useStartPageTransition` for programmatic navigation in <Header/>) all
// read/write through the Jotai atom below.
//
// Why Jotai: it's already a dep, gives us a module-scoped store without
// needing a <Provider> wrapper, and the default value is consumed identically
// on the server and the first client render — so the SSR'd overlay matches
// hydration without any mismatch.

import { atom, useSetAtom } from "jotai";
import { usePathname } from "next/navigation";
import { useCallback } from "react";

export type PageTransitionState = {
  /** Is the loader currently shown? */
  visible: boolean;
  /**
   * Monotonically increasing id, bumped on every fresh transition. The
   * overlay's inner DOM (SVG <text>, progress bar) is keyed on this so the
   * draw-on / grow animations remount and replay each time. SSR starts at 0
   * so the first cold-load paint plays the intro animation once.
   */
  transitionId: number;
  /**
   * Timestamp (`Date.now()`) at which the loader was shown for THIS
   * transition. Used to enforce {@link MIN_VISIBLE_MS} — we never just flash
   * the loader. 0 on SSR / cold load (no artificial floor on cold load —
   * the wait-for-images itself provides the visible time).
   */
  startedAt: number;
};

export const pageTransitionAtom = atom<PageTransitionState>({
  // Visible on cold load so the overlay is in the first paint — no flash of
  // unloaded content while the new page's images decode.
  visible: true,
  transitionId: 0,
  startedAt: 0,
});

/**
 * Minimum time the loader stays "engaged" on an in-app navigation (ms).
 * Counted from the moment the curtain starts closing — so with a 550ms close
 * and 550ms open this gives ~300ms of fully-covered "brand visible" hold in
 * between (enough to read the wordmark). Doesn't apply on cold loads
 * (startedAt = 0; wait-for-images provides the visible time naturally).
 */
export const MIN_VISIBLE_MS = 850;
/** Hard ceiling on waiting for critical images (ms) — never hang. */
export const MAX_WAIT_MS = 1500;
/**
 * Fixed grace period on /album navigations. The R3F book's textures don't
 * surface as <img> elements above the fold, so geometry-based detection finds
 * nothing; this gives the local /public/textures a moment to load before reveal.
 */
export const ALBUM_GRACE_MS = 800;

/** Route prefixes that should NOT trigger the loader. The Feather Fables reader
 *  bootstraps its own skeleton + windowed lazy <img>s, so the curtain's
 *  wait-for-images would hang on it; suppress the reader (the landing keeps it). */
export const SUPPRESS_PREFIXES = ["/admin", "/feather-fables/read"];

export function isSuppressedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return SUPPRESS_PREFIXES.some((p) => pathname.startsWith(p));
}

/**
 * Hook for callsites that navigate programmatically (Header's `router.push`).
 * Call `startPageTransition(href)` BEFORE the push so the overlay is already
 * showing when the new route's data fetch / mount begins. Skips automatically
 * for same-pathname / external / mailto / suppressed targets.
 */
export function useStartPageTransition() {
  const set = useSetAtom(pageTransitionAtom);
  const pathname = usePathname();
  return useCallback(
    (targetHref: string) => {
      if (!targetHref) return;
      if (/^(https?:|mailto:|tel:)/.test(targetHref)) return;
      if (isSuppressedPath(targetHref) || isSuppressedPath(pathname)) return;
      // Same pathname → it's a hash/scroll, not a page change.
      const targetPath = targetHref.startsWith("/")
        ? targetHref.split("#")[0] || "/"
        : targetHref;
      if (targetPath === pathname) return;
      set((s) => ({
        visible: true,
        transitionId: s.transitionId + 1,
        startedAt: Date.now(),
      }));
    },
    [pathname, set],
  );
}

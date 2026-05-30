"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(min-width: 768px)";

/**
 * True at the md+ breakpoint (≥768px). `useSyncExternalStore` subscribes to
 * `matchMedia` the React-blessed way; the server snapshot is `false` so SSR and
 * first client render agree (no hydration mismatch), then it flips on desktop.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    (callback) => {
      if (typeof window === "undefined") return () => {};
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", callback);
      return () => mq.removeEventListener("change", callback);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

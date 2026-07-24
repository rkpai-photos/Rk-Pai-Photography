"use client";

import { useEffect, useState, type RefObject } from "react";
import { Maximize, Minimize } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

// Toggles fullscreen on the reader stage. iOS Safari blocks element fullscreen
// (only <video> qualifies), so requestFullscreen is optional-chained and simply
// no-ops there instead of throwing.
export default function FullscreenButton({
  targetRef,
  className,
}: {
  targetRef: RefObject<HTMLElement | null>;
  className?: string;
}) {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = async () => {
    try {
      if (!document.fullscreenElement) {
        const el = targetRef.current ?? document.documentElement;
        await el.requestFullscreen?.();
        trackEvent("fullscreen_enabled");
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      /* fullscreen unsupported / blocked — ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFs ? "Exit fullscreen" : "Fullscreen"}
      className={className}
    >
      {isFs ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
    </button>
  );
}

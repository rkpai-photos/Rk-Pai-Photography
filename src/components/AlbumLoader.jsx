// @ts-nocheck
"use client";

// Loading overlay for the /album 3D book. The R3F <Canvas> paints blank while
// drei's useTexture pulls the page textures (58 webp faces), so we cover it with
// an on-brand "Opening the album" screen. Progress comes from drei's
// useProgress, which tracks the default THREE loading manager that useTexture
// feeds — and which works outside <Canvas>, so this is a plain DOM overlay.
//
// It fades out once the textures are in. Safety timers make sure a fully-cached
// revisit (where the manager may never report activity) can't trap the user
// behind the overlay.
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function AlbumLoader() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);

  // Read the latest `active` inside the mount-only safety effect without making
  // it a dependency.
  const activeRef = useRef(active);
  activeRef.current = active;

  // Normal path: hide once the loaders go idle at full progress (short delay so
  // the fade can play).
  useEffect(() => {
    if (!active && progress >= 100) {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [active, progress]);

  // Safety: if every texture is already cached the manager may sit idle at
  // progress 0. Hide shortly after mount when nothing is in flight, and
  // hard-hide after a generous ceiling so the overlay can never stick.
  useEffect(() => {
    const settle = setTimeout(() => {
      if (!activeRef.current) setVisible(false);
    }, 1500);
    const hard = setTimeout(() => setVisible(false), 10000);
    return () => {
      clearTimeout(settle);
      clearTimeout(hard);
    };
  }, []);

  const pct = Math.min(100, Math.round(progress));

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          key="album-loader"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-stone-200"
        >
          <div className="flex flex-col items-center gap-6 px-8 text-center">
            {/* gentle page-turn flip on the book glyph */}
            <motion.div
              animate={{ rotateY: [0, 22, 0, -22, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ transformPerspective: 600 }}
            >
              <BookOpen className="h-10 w-10 text-stone-500" strokeWidth={1.25} />
            </motion.div>

            <div className="space-y-1.5">
              <h2 className="font-playfair text-2xl text-stone-800 md:text-3xl">
                Opening the album
              </h2>
              <p className="text-sm tracking-wide text-stone-500">
                Turning to the first page…
              </p>
            </div>

            <div className="mt-1 w-56 max-w-[70vw]">
              <div className="h-[3px] w-full overflow-hidden rounded-full bg-stone-300/80">
                <div
                  className="h-full rounded-full bg-stone-700 transition-all duration-300 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 font-mono text-[0.7rem] tracking-[0.2em] text-stone-500">
                {pct}%
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* eslint-disable */
// @ts-nocheck
// UI.jsx
"use client";
import React, { useEffect, useCallback, useRef } from "react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import debounce from "lodash/debounce";
import { pageAtom } from "./Book"; // Import pageAtom from Book.jsx
export const UI = () => {
  const [page] = useAtom(pageAtom);

  const playPageFlipSound = useCallback(
    debounce(() => {
      const audio = new Audio("/audios/page-flip-01a.mp3");
      audio.volume = 0.6;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.log("Audio playback failed:", error);
        });
      }
    }, 100),
    [],
  );

  // Only play the flip sound when the page actually changes — not on mount.
  // (A useEffect always fires once after the first render; since you reach
  // /album via an in-app click, the browser's autoplay gate is already open,
  // so that mount-run would otherwise play the sound on page load.)
  const didMount = useRef(false);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    playPageFlipSound();
  }, [page, playPageFlipSound]);

  return (
    <>
      <main className="pointer-events-none select-none fixed inset-0 flex flex-col items-center justify-between z-10">
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >

          </motion.div>
        </div>

      </main>

      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        body {
          background: linear-gradient(
            to bottom,
            rgba(15, 23, 42, 1),
            rgba(30, 41, 59, 1)
          );
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </>
  );
};

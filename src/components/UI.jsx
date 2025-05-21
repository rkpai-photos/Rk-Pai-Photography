// UI.jsx
"use client";
import React, { useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { debounce } from "lodash";
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

  useEffect(() => {
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
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-[\'Playfair Display\'] text-white tracking-tight mb-6 hover:scale-105 transition-transform duration-500">
              Wildlife Photography
            </h1>
            <div className="flex items-center justify-center gap-4 text-white/80">
              <Camera className="w-6 h-6" />
              <p className="text-lg md:text-xl font-light">
                A Journey Through Nature
              </p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full bg-black/20 backdrop-blur-sm py-4"
        >
          <div className="max-w-7xl mx-auto px-4 text-center text-white/60">
            <p className="text-sm md:text-base">
              Navigate through the pages to explore captivating moments in
              nature
            </p>
          </div>
        </motion.div>
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

"use client";

import { X } from "lucide-react";
import { thumbUrl, type Book } from "@/data/books";

// Slide-over grid of page thumbnails for quick navigation. Thumbs are lazy
// (~5-15KB each) so opening the panel doesn't fetch all 108 at once.
export default function ThumbnailSidebar({
  book,
  current,
  open,
  onClose,
  onJump,
}: {
  book: Book;
  current: number; // 1-based
  open: boolean;
  onClose: () => void;
  onJump: (page1: number) => void;
}) {
  return (
    <>
      {/* scrim */}
      <div
        onClick={onClose}
        aria-hidden={!open}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Page thumbnails"
        className={`fixed right-0 top-0 z-50 h-full w-[min(86vw,340px)] bg-stone-900 text-stone-100 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <span className="font-playfair text-lg">Pages</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close thumbnails"
            className="p-1.5 rounded-md hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: book.pageCount }, (_, i) => {
              const n = i + 1;
              const active = n === current;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onJump(n)}
                  className={`group relative block overflow-hidden rounded-md ring-1 transition ${
                    active
                      ? "ring-2 ring-amber-400"
                      : "ring-white/10 hover:ring-white/40"
                  }`}
                  style={{ aspectRatio: String(book.aspect) }}
                >
                  {/* plain img + lazy: the panel may hold 108 thumbs */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(book, n)}
                    alt={`Page ${n}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums">
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import { useEffect, useState, type RefObject } from "react";
import TransitionLink from "@/components/TransitionLink";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Download,
  Languages,
} from "lucide-react";
import FullscreenButton from "./FullscreenButton";
import { trackEvent } from "@/lib/analytics";
import type { Book, BookLang } from "@/data/books";

const iconBtn =
  "p-2 rounded-md hover:bg-white/10 transition-colors disabled:opacity-40";

export default function ReaderToolbar({
  book,
  lang,
  otherLangHref,
  current,
  total,
  onPrev,
  onNext,
  onJump,
  onToggleThumbs,
  fullscreenTargetRef,
  pdfUrl,
}: {
  book: Book;
  lang: BookLang;
  otherLangHref: string;
  current: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (page1: number) => void;
  onToggleThumbs: () => void;
  fullscreenTargetRef: RefObject<HTMLElement | null>;
  pdfUrl: string;
}) {
  const [draft, setDraft] = useState(String(current));
  useEffect(() => setDraft(String(current)), [current]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1 && n <= total) onJump(n);
    else setDraft(String(current));
  };

  return (
    <header className="z-30 flex h-14 items-center gap-2 bg-stone-900 px-3 text-stone-100 shadow-md md:gap-4 md:px-5">
      <TransitionLink
        href="/feather-fables"
        aria-label="Back to book page"
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 hover:bg-white/10"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="hidden sm:inline">Back</span>
      </TransitionLink>

      <h1 className="truncate font-playfair text-base md:text-lg">{book.title}</h1>

      {/* Language toggle — full reload to the other edition (rare action). */}
      <a
        href={otherLangHref}
        title={lang === "en" ? "ಕನ್ನಡದಲ್ಲಿ ಓದಿ" : "Read in English"}
        className="ml-1 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs hover:bg-white/10"
      >
        <Languages className="h-3.5 w-3.5" />
        {lang === "en" ? "ಕನ್ನಡ" : "English"}
      </a>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        <button type="button" onClick={onPrev} aria-label="Previous page" className={iconBtn}>
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1 text-sm tabular-nums">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
            }}
            inputMode="numeric"
            aria-label="Go to page"
            className="w-11 rounded bg-white/10 px-1 py-1 text-center outline-none focus:bg-white/20"
          />
          <span className="text-stone-400">/ {total}</span>
        </div>

        <button type="button" onClick={onNext} aria-label="Next page" className={iconBtn}>
          <ChevronRight className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={onToggleThumbs}
          aria-label="Page thumbnails"
          title="Pages"
          className={iconBtn}
        >
          <LayoutGrid className="h-5 w-5" />
        </button>

        <FullscreenButton targetRef={fullscreenTargetRef} className={iconBtn} />

        {pdfUrl ? (
          <a
            href={pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent("pdf_downloaded", { book: book.slug })}
            aria-label="Download PDF"
            title="Download PDF"
            className={iconBtn}
          >
            <Download className="h-5 w-5" />
          </a>
        ) : null}
      </div>
    </header>
  );
}

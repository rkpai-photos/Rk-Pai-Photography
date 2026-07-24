"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getBookByLang } from "@/data/books";
import { trackEvent } from "@/lib/analytics";
import ReaderSkeleton from "@/components/feather-fables/ReaderSkeleton";
import ReaderToolbar from "@/components/feather-fables/ReaderToolbar";
import ThumbnailSidebar from "@/components/feather-fables/ThumbnailSidebar";
import type { FlipApi } from "@/components/feather-fables/FlipBook";

// page-flip touches window/DOM — never render it on the server.
const FlipBook = dynamic(() => import("@/components/feather-fables/FlipBook"), {
  ssr: false,
  loading: () => <ReaderSkeleton />,
});

function ReaderInner() {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang") === "kn" ? "kn" : "en";
  const book = getBookByLang(lang);
  const lsKey = `ff:lastPage:${book.slug}`;

  const stageRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<FlipApi | null>(null);
  const firstChange = useRef(true);

  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(book.pageCount);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  // Mobile swipe hint — shown until the first real navigation, then faded out.
  const [hasNavigated, setHasNavigated] = useState(false);

  // Initial page: ?page=N  >  localStorage(last read)  >  1. Computed once.
  const initialPage = useMemo(() => {
    const ok = (n: number) =>
      Number.isFinite(n) && n >= 1 && n <= book.pageCount ? n : null;
    const fromQuery = ok(parseInt(searchParams.get("page") ?? "", 10));
    if (fromQuery) return fromQuery;
    if (typeof window !== "undefined") {
      const saved = ok(parseInt(localStorage.getItem(lsKey) ?? "", 10));
      if (saved) return saved;
    }
    return 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    trackEvent("book_opened", { book: book.slug });
  }, [book.slug]);

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrent(page);
      try {
        localStorage.setItem(lsKey, String(page));
      } catch {
        /* private mode / disabled storage */
      }
      // Reflect the page in the URL without a Next navigation (no re-render).
      const url = new URL(window.location.href);
      url.searchParams.set("page", String(page));
      window.history.replaceState(null, "", url.toString());
      if (firstChange.current) firstChange.current = false;
      else {
        setHasNavigated(true);
        trackEvent("page_turned", { book: book.slug, page });
      }
    },
    [lsKey, book.slug],
  );

  const handleInit = useCallback((api: FlipApi, t: number) => {
    apiRef.current = api;
    setTotal(t);
  }, []);

  // Keyboard ←/→ (ignored while typing in the page-jump input).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") apiRef.current?.next();
      else if (e.key === "ArrowLeft") apiRef.current?.prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const jump = useCallback((n: number) => apiRef.current?.turnTo(n), []);

  return (
    <div ref={stageRef} className="fixed inset-0 z-[60] flex flex-col bg-parchment">
      <ReaderToolbar
        book={book}
        lang={lang}
        otherLangHref={`/feather-fables/read?lang=${lang === "kn" ? "en" : "kn"}`}
        current={current}
        total={total}
        onPrev={() => apiRef.current?.prev()}
        onNext={() => apiRef.current?.next()}
        onJump={jump}
        onToggleThumbs={() => setThumbsOpen((v) => !v)}
        fullscreenTargetRef={stageRef}
      />

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-2 py-3 md:px-6 md:py-5">
        <FlipBook
          key={book.slug}
          book={book}
          initialPage={initialPage}
          onPageChange={handlePageChange}
          onInit={handleInit}
        />

        {/* Mobile-only swipe affordance. Bidirectional chevrons signal that you
            can swipe either way; fades out once the reader navigates. */}
        <p
          aria-hidden
          className={`mt-5 flex select-none items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400 transition-opacity duration-700 md:hidden ${
            hasNavigated ? "opacity-0" : "opacity-100"
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5 animate-pulse" />
          Swipe to turn pages
          <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
        </p>
      </div>

      <ThumbnailSidebar
        book={book}
        current={current}
        open={thumbsOpen}
        onClose={() => setThumbsOpen(false)}
        onJump={(n) => {
          jump(n);
          setThumbsOpen(false);
        }}
      />
    </div>
  );
}

export default function ReaderPage() {
  // useSearchParams() requires a Suspense boundary in Next 16.
  return (
    <Suspense fallback={<ReaderSkeleton />}>
      <ReaderInner />
    </Suspense>
  );
}

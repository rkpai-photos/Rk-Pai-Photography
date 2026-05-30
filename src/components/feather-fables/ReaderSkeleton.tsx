// Loading fallback for the dynamically-imported FlipBook (ssr:false).
export default function ReaderSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center bg-parchment">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-stone-400/40 border-t-stone-600 animate-spin" />
        <p className="font-playfair text-lg tracking-wide text-stone-500">
          Opening the book…
        </p>
      </div>
    </div>
  );
}

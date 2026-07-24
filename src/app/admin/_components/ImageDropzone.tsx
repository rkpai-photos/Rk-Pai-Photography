"use client";

// Drag-and-drop image picker for the photo form. Hand-rolled (no react-dropzone
// dep) — the use case is small enough that the extra dep isn't worth it.
// Receives a controlled `file` value; emits via `onFileChange`. When editing,
// pass `existingImageUrl` so the user sees the current image until they pick a
// new one.

import {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
  MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ImagePlus, Replace, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageDropzoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  existingImageUrl?: string | null;
  disabled?: boolean;
}

export default function ImageDropzone({
  file,
  onFileChange,
  existingImageUrl,
  disabled,
}: ImageDropzoneProps) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Derived preview URL: an object URL for the locally-picked file, or the
  // existing photo's stored URL when editing without a replacement. No
  // useState/useEffect pair here — the React Compiler's
  // react-hooks/set-state-in-effect rule rightly flags that pattern. The
  // cleanup effect below revokes blob URLs when they change or on unmount.
  const previewUrl = useMemo<string | null>(() => {
    if (file) return URL.createObjectURL(file);
    return existingImageUrl ?? null;
  }, [file, existingImageUrl]);

  useEffect(() => {
    if (previewUrl?.startsWith("blob:")) {
      return () => URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const acceptFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked && picked.type.startsWith("image/")) {
      onFileChange(picked);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setHover(false);
    if (disabled) return;
    acceptFiles(e.dataTransfer.files);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setHover(true);
  };

  const openPicker = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
    e.target.value = ""; // allow re-picking the same file
  };

  const removeNewFile = (e: MouseEvent) => {
    e.stopPropagation();
    onFileChange(null);
  };

  const replaceClick = (e: MouseEvent) => {
    e.stopPropagation();
    openPicker();
  };

  const hasPreview = !!previewUrl;
  const hasNewFile = !!file;

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      onClick={openPicker}
      onKeyDown={onKeyDown}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={() => setHover(false)}
      aria-label="Upload an image"
      className={cn(
        "relative flex flex-col items-center justify-center w-full aspect-[16/10] rounded-xl border-2 border-dashed bg-stone-50 transition-colors overflow-hidden",
        hover ? "border-stone-900 bg-stone-100" : "border-stone-300",
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-stone-400",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChange}
        className="sr-only"
        disabled={disabled}
      />

      {hasPreview ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl ?? undefined}
            alt="Selected"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            {hasNewFile && (
              <button
                type="button"
                onClick={removeNewFile}
                disabled={disabled}
                className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-white/90 backdrop-blur text-stone-900 text-sm font-medium hover:bg-white disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={replaceClick}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 px-3 h-9 rounded-md bg-white/90 backdrop-blur text-stone-900 text-sm font-medium hover:bg-white disabled:opacity-50"
            >
              <Replace className="w-4 h-4" />
              {hasNewFile ? "Choose different" : "Replace"}
            </button>
          </div>
          {hasNewFile && (
            <div className="absolute top-3 left-3 px-2.5 py-1 rounded text-xs bg-emerald-500/90 text-white font-medium max-w-[calc(100%-1.5rem)] truncate">
              New: {file.name} · {(file.size / 1024).toFixed(0)} KB
            </div>
          )}
        </>
      ) : (
        <div className="text-center pointer-events-none px-4">
          <ImagePlus className="w-10 h-10 mx-auto text-stone-400" />
          <p className="mt-3 text-sm font-medium text-stone-700">
            Drag an image here, or click to browse
          </p>
          <p className="mt-1 text-xs text-stone-500">PNG, JPG, WebP</p>
        </div>
      )}
    </div>
  );
}

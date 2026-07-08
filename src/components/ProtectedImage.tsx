"use client";

import Image from "next/image";
import type { ComponentProps } from "react";

type ProtectedImageProps = ComponentProps<typeof Image>;

/** Wraps next/image with anti-download deterrents: suppresses the right-click
 *  context menu, drag-to-save, and image selection. This stops casual saves,
 *  not forensic ones — a determined user can still reach the bytes via
 *  DevTools → Network or a screenshot. */
export default function ProtectedImage({
  className = "",
  ...props
}: ProtectedImageProps) {
  return (
    <Image
      {...props}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      className={`${className} select-none`}
    />
  );
}

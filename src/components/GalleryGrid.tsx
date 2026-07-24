// @ts-nocheck
"use client";
import { useEffect, useRef } from "react";
import Link from "@/components/TransitionLink";
import ProtectedImage from "@/components/ProtectedImage";
import Masonry from "react-masonry-css";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface Photo {
  id: string;
  src?: string; // Original field
  alt: string;
  width: number;
  height: number;
  story?: string;
  cameraSpecs?: Record<string, string> | string;
  // New fields from Google Sheets
  image_url?: string;
  image_type?: string;
  created_at?: string;
  createdAt?: string; // Processed field from fetchPhotos
  blurDataURL?: string; // LQIP placeholder
}

interface GalleryGridProps {
  photos: Photo[];
}

let hasAnimatedGlobal = false;

export default function GalleryGrid({ photos }: GalleryGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimatedGlobal) {
      if (gridRef.current) {
        const items = gsap.utils.toArray(".gallery-item");
        gsap.set(items, { opacity: 1, y: 0 });
      }
      return;
    }

    const ctx = gsap.context(() => {
      if (gridRef.current) {
        const items = gsap.utils.toArray(".gallery-item");
        if (items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              stagger: 0.1,
              duration: 0.5,
              ease: "power2.out",
              onComplete: () => {
                hasAnimatedGlobal = true;
              },
              scrollTrigger: {
                trigger: gridRef.current,
                start: "top bottom-=100",
                end: "bottom top+=100",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      }
    }, gridRef);
    return () => ctx.revert();
  }, [photos]);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  // Handle empty photo collection
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
          No photos available
        </h2>
      </div>
    );
  }

  return (
    <div ref={gridRef}>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {photos.map((photo) => {
          // Use image_url as fallback if src is not available
          const imageUrl = photo.src || photo.image_url || "";
          // Format date if available
          const dateString = photo.createdAt || photo.created_at;
          const formattedDate = dateString
            ? new Date(dateString).toLocaleDateString()
            : "";

          return (
            <Link
              href={`/stories/${photo.id}`}
              key={photo.id}
              className="block mb-4 gallery-item"
            >
              <div className="relative overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <ProtectedImage
                  src={imageUrl}
                  alt={photo.alt || "Photography"}
                  width={parseInt(String(photo.width)) || 800}
                  height={parseInt(String(photo.height)) || 600}
                  // Matches the masonry column counts (4/3/2/1) so Next serves
                  // appropriately-sized bytes instead of a full-width variant.
                  sizes="(max-width: 500px) 100vw, (max-width: 700px) 50vw, (max-width: 1100px) 33vw, 25vw"
                  // LQIP: show the blurred preview instantly, cross-fade to the
                  // real image. Falls back to no placeholder for legacy rows.
                  placeholder={photo.blurDataURL ? "blur" : "empty"}
                  blurDataURL={photo.blurDataURL}
                  className="w-full h-auto object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-300 flex flex-col items-center justify-center">
                  <span className="text-white text-lg font-semibold opacity-0 hover:opacity-100 transition-opacity duration-300">
                    View Story
                  </span>
                  {formattedDate && (
                    <span className="text-white text-sm opacity-0 hover:opacity-100 transition-opacity duration-300 mt-2">
                      {formattedDate}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </Masonry>
    </div>
  );
}

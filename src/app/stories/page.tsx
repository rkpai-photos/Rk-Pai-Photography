// @ts-nocheck
import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/sections/Header";
import GalleryGrid from "@/components/GalleryGrid";
import JsonLd from "@/components/JsonLd";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchPhotos } from "@/lib/photo";
import {
  absoluteUrl,
  person,
  siteLanguage,
  siteName,
} from "@/lib/site";

// ISR: cache the gallery render (and warm the image-optimizer cache) for 60s
// rather than re-querying Convex on every request. (Was force-dynamic.)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Stories",
  description:
    "A gallery of wildlife and bird photographs by RK Pai — each image tells a story of patience, passion, and connection with the natural world.",
  alternates: { canonical: "/stories" },
  openGraph: {
    title: "Stories",
    description:
      "A gallery of wildlife and bird photographs by RK Pai — each image tells a story of patience, passion, and connection with the natural world.",
    type: "website",
    url: "/stories",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stories",
    description:
      "A gallery of wildlife and bird photographs by RK Pai.",
  },
};

export default async function StoriesPage() {
  const photosData = await fetchPhotos();

  // CollectionPage describes the gallery itself; the individual Photograph
  // schemas live on /stories/[id]. Listing slugs here as `hasPart` would be
  // accurate but high-volume — Google's docs prefer the index page describe
  // itself and let the detail pages declare the items, which is what we do.
  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Stories — ${siteName}`,
    description:
      "Gallery of wildlife and bird photographs by RK Pai.",
    url: absoluteUrl("/stories"),
    inLanguage: siteLanguage,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl("/"),
    },
    author: person,
    creator: person,
  };

  if (!photosData || photosData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <JsonLd data={collectionJsonLd} />
        <Header />
        <div className="container mx-auto px-4 pt-32 md:pt-40 pb-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            No photos available
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <JsonLd data={collectionJsonLd} />
      <Header />
      <div className="container mx-auto px-4 pt-32 md:pt-40 pb-12">
        <Suspense fallback={<LoadingSpinner />}>
          <GalleryGrid photos={photosData} />
        </Suspense>
      </div>
    </div>
  );
}

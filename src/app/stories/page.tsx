import { Suspense } from "react";
import Header from "@/sections/Nav";
import GalleryGrid from "@/components/GalleryGrid";
import LoadingSpinner from "@/components/LoadingSpinner";
import { fetchPhotos } from "@/lib/photo";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const photosData = await fetchPhotos();

  if (!photosData || photosData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <div className="mb-10 pb-10">
          <Header />
        </div>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
            No photos available
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <div className="mb-10 pb-10">
        <Header />
      </div>
      <div className="container mx-auto px-4 py-12">
        <Suspense fallback={<LoadingSpinner />}>
          <GalleryGrid photos={photosData} />
        </Suspense>
      </div>
    </div>
  );
}

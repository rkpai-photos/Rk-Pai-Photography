/* eslint-disable */
// @ts-nocheck
import type { Metadata } from "next";

import { fetchPhotoBySlug, fetchPhotos } from "@/lib/photo";
import Image from "next/image";
import { Camera, BookOpen, Calendar, MapPin } from "lucide-react";
import Header from "@/sections/Header";
import JsonLd from "@/components/JsonLd";
import {
  absoluteUrl,
  person,
  siteLanguage,
  siteName,
} from "@/lib/site";
import TypeWriter from "./TypeWriter";
import PhotoDetailClient from "./PhotoClinet";

// Next 16: `params` is a Promise — must be awaited.
//
// generateMetadata sets title/description/canonical + Open Graph + Twitter
// per photo. The OG image itself is auto-wired by Next from the sibling
// opengraph-image.tsx in this same route segment — no need to set
// `openGraph.images` here.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const photo = await fetchPhotoBySlug(id);

  if (!photo) {
    return {
      title: "Photo Not Found",
      description: "The requested photo does not exist.",
      robots: { index: false, follow: false },
    };
  }

  const title = photo.alt || "Photograph";
  // Trim long stories to a meta-description-friendly length.
  const description = photo.story
    ? photo.story.length > 160
      ? `${photo.story.slice(0, 157).trimEnd()}…`
      : photo.story
    : `Wildlife photograph by RK Pai${
        photo.location ? ` — ${photo.location}` : ""
      }.`;
  const path = `/stories/${id}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title,
      description,
      url: path,
      ...(photo.created_at && { publishedTime: photo.created_at }),
      authors: [person.name],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PhotoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photos = await fetchPhotos();
  const photo = photos.find((p) => p.id === id);

  if (!photo) {
    return (
      <div className="relative min-h-screen bg-stone-200 p-4 md:p-8 pt-28 md:pt-36 font-sans overflow-hidden flex items-center justify-center">
        <Header />
        <div className="text-center backdrop-blur-md bg-white/40 dark:bg-gray-800/40 rounded-3xl p-8 border border-white/30 shadow-lg max-w-md mx-auto">
          <h1 className="text-3xl font-bold text-red-500 mb-4">
            Photo Not Found
          </h1>
          <p className="text-gray-700 dark:text-gray-300">
            The requested photo does not exist.
          </p>
        </div>
      </div>
    );
  }

  // schema.org Photograph — gives Google enough structure to render this in
  // Image Search with proper title/description/credit, and unlocks rich-result
  // eligibility. `creator` + `copyrightHolder` are the Person from site.ts.
  const photographJsonLd = {
    "@context": "https://schema.org",
    "@type": "Photograph",
    name: photo.alt,
    ...(photo.story && { description: photo.story, caption: photo.story }),
    url: absoluteUrl(`/stories/${photo.id}`),
    contentUrl: photo.image_url,
    thumbnailUrl: photo.image_url,
    ...(photo.width && { width: photo.width }),
    ...(photo.height && { height: photo.height }),
    ...(photo.created_at && { datePublished: photo.created_at }),
    ...(photo.location && {
      contentLocation: { "@type": "Place", name: photo.location },
      locationCreated: { "@type": "Place", name: photo.location },
    }),
    creator: person,
    copyrightHolder: person,
    author: person,
    isPartOf: {
      "@type": "WebSite",
      name: siteName,
      url: absoluteUrl("/"),
    },
    inLanguage: siteLanguage,
  };

  return (
    <div className="relative min-h-screen bg-stone-200 p-4 md:p-8 pt-28 md:pt-36 font-sans overflow-hidden">
      <JsonLd data={photographJsonLd} />
      <Header />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="backdrop-blur-md bg-white/60 dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 mb-8 border border-white/50 shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <TypeWriter
              text={photo.alt}
              delay={80}
              className="font-playfair text-2xl md:text-4xl tracking-tight text-gray-800 dark:text-gray-100 mb-4 md:mb-0 font-bold"
            />
            <PhotoDetailClient initialCreatedAt={photo.created_at} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 w-full">
            <div className="relative group">
              <div className="relative rounded-3xl overflow-hidden shadow-xl transform transition-transform duration-500 hover:scale-[1.01]">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  src={photo.image_url}
                  alt={photo.alt}
                  width={photo.width}
                  height={photo.height}
                  // `width`/`height` + `w-full h-auto` already makes this responsive;
                  // the legacy `layout="responsive"` prop was removed in Next 13.
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="w-full h-auto object-cover"
                  priority
                />
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-white font-medium text-sm">
                      {photo.width}x{photo.height}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {photo.story && (
            <div className="lg:col-span-2 backdrop-blur-md bg-white/60 dark:bg-gray-800/60 rounded-3xl p-6 md:p-8 border border-white/50 shadow-xl transition-all duration-300 hover:shadow-2xl flex flex-col">
              <div className="flex items-center mb-6">
                <BookOpen className="w-6 h-6 md:w-7 md:h-7 mr-3 text-green-500" />
                <TypeWriter
                  className="text-xl md:text-2xl text-gray-800 dark:text-gray-100 font-medium"
                  text="The Story Behind"
                  delay={80}
                />
              </div>

              <div className="prose prose-sm md:prose-lg dark:prose-invert max-w-none flex-1 flex flex-col justify-center">
                <div className="relative">
                  <div className="absolute -left-4 top-0 text-6xl text-green-400/30 font-serif">
                    "
                  </div>
                  <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed font-semibold italic pl-4 mb-6">
                    {photo.story}
                  </p>
                  <div className="absolute -right-4 bottom-0 text-6xl text-green-400/30 font-serif">
                    "
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200/30 dark:border-gray-700/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Posted :{" "}
                      {new Date(photo.created_at).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>

                  {photo.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {photo.location}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

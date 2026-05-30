import Image from "next/image";
import { BookOpen, Download, Box } from "lucide-react";

import Header from "@/sections/Header";
import Footer from "@/sections/Footer";
import JsonLd from "@/components/JsonLd";
import TransitionLink from "@/components/TransitionLink";
import {
  featherFables,
  featherFablesKannada,
  pageUrl,
  webPdfUrl,
} from "@/data/books";
import { absoluteUrl, person, siteName, siteLanguage } from "@/lib/site";

export const revalidate = 60;

export default function FeatherFablesLanding() {
  const book = featherFables;
  const cover = pageUrl(book, book.coverPage);
  const pdf = webPdfUrl(book);
  const kannadaPdf = webPdfUrl(featherFablesKannada);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    alternativeHeadline: book.subtitle,
    author: person,
    publisher: person,
    inLanguage: siteLanguage,
    bookFormat: "https://schema.org/EBook",
    numberOfPages: book.pageCount,
    image: absoluteUrl(cover),
    url: absoluteUrl("/feather-fables"),
    isPartOf: { "@type": "WebSite", name: siteName, url: absoluteUrl("/") },
  };

  return (
    <div className="relative min-h-screen bg-stone-200 font-sans">
      <JsonLd data={jsonLd} />
      <Header />

      <main className="mx-auto max-w-6xl px-4 pb-24 pt-28 md:px-8 md:pt-36">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Cover */}
          <div className="order-2 md:order-1">
            <div className="mx-auto w-full max-w-md md:max-w-none">
              <div className="overflow-hidden rounded-lg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] ring-1 ring-black/5">
                <Image
                  src={cover}
                  alt={`${book.title} — cover`}
                  width={book.pageWidth}
                  height={book.pageHeight}
                  priority
                  sizes="(max-width: 768px) 90vw, 45vw"
                  className="h-auto w-full"
                />
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="order-1 md:order-2">
            <p className="mb-3 text-xs uppercase tracking-[0.25em] text-stone-500">
              A Photography Book
            </p>
            <h1 className="font-playfair text-4xl font-bold leading-tight text-stone-900 md:text-6xl">
              {book.title}
            </h1>
            <p className="mt-4 font-lora text-lg italic text-stone-600 md:text-xl">
              {book.subtitle}
            </p>
            <p className="mt-6 text-stone-700">
              by <span className="font-medium">{book.author}</span>
            </p>
            <p className="mt-1 text-sm text-stone-500">{book.pageCount} pages</p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TransitionLink
                href="/feather-fables/read"
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm font-medium text-stone-50 shadow-lg transition hover:bg-stone-800"
              >
                <BookOpen className="h-4 w-4" /> Read Online
              </TransitionLink>
              {pdf ? (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-stone-400 px-6 py-3 text-sm font-medium text-stone-800 transition hover:bg-stone-300"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
              ) : null}
            </div>

            {/* Kannada edition */}
            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <span className="text-stone-500">Also in ಕನ್ನಡ:</span>
              <TransitionLink
                href="/feather-fables/read?lang=kn"
                className="inline-flex items-center gap-1.5 font-medium text-stone-800 underline-offset-4 hover:underline"
              >
                <BookOpen className="h-4 w-4" /> ಓದಿ
              </TransitionLink>
              {kannadaPdf ? (
                <a
                  href={kannadaPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-stone-600 underline-offset-4 hover:underline"
                >
                  <Download className="h-4 w-4" /> PDF
                </a>
              ) : null}
            </div>

            <TransitionLink
              href="/album"
              className="mt-8 inline-flex items-center gap-1.5 text-sm text-stone-500 underline-offset-4 transition hover:text-stone-800 hover:underline"
            >
              <Box className="h-4 w-4" /> Prefer the 3D book? View the album
            </TransitionLink>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

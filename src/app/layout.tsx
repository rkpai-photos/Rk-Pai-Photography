import type { Metadata } from "next";
import "./globals.css";
import { Archivo, Playfair_Display, Playwrite_GB_S } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";

import ConvexClientProvider from "@/components/ConvexClientProvider";
import JsonLd from "@/components/JsonLd";
import TransitionOverlay from "@/components/TransitionOverlay";
import {
  defaultDescription,
  defaultKeywords,
  defaultTitle,
  person,
  siteLanguage,
  siteLocale,
  siteName,
  siteUrl,
  titleTemplate,
} from "@/lib/site";

const archivo = Archivo({
  display: "swap",
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-archivo",
});

// Display serif used by <TransitionOverlay>'s wordmark and by the
// `font-playfair` class scattered through stories/[id]/page.tsx (which until
// now resolved to nothing — see CONTEXT.md §11). Loaded with display:swap so
// the curtain doesn't FOIT; metric-compatible fallback is auto-generated.
const playfair = Playfair_Display({
  display: "swap",
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-playfair",
});

// Cursive "learning-to-write" script used for the About-section bio paragraphs
// (CONTEXT.md §11). Playwrite GB S = Playwrite Great Britain SemiJoined; the
// family is inherently cursive (no separate italic style — slant is baked in),
// so the `italic` utility we pair this with on the paragraph is mostly for
// spec alignment. Weight 300 is at the lighter end of the 100–400 range.
const playwrite = Playwrite_GB_S({
  display: "swap",
  weight: ["300"],
  variable: "--font-playwrite",
});

// Site-wide SEO defaults. Every page inherits these and overrides only what
// differs (mostly title + description). `metadataBase` is the anchor that
// resolves every relative URL in `openGraph.images`, `alternates.canonical`,
// `manifest`, etc. — without it, social previews break.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: defaultTitle, template: titleTemplate },
  description: defaultDescription,
  applicationName: siteName,
  authors: [{ name: person.name, url: person.url }],
  creator: person.name,
  publisher: person.name,
  keywords: defaultKeywords,
  category: "photography",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName,
    locale: siteLocale,
    url: siteUrl,
    title: defaultTitle,
    description: defaultDescription,
    // images default to /opengraph-image — auto-wired from app/opengraph-image.tsx.
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Site-level JSON-LD: a WebSite that names the Person who runs it. Inlined in
  // every page; payload is < 1 KB. Per-page schemas (CollectionPage on /stories,
  // Photograph on /stories/[id]) are injected by those pages on top.
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: siteUrl,
    description: defaultDescription,
    inLanguage: siteLanguage,
    author: person,
    publisher: person,
    copyrightHolder: person,
  };

  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <body
          className={`antialiased bg-stone-200 text-stone-900 ${archivo.variable} ${playfair.variable} ${playwrite.variable} font-sans`}
        >
          <JsonLd data={siteJsonLd} />
          <ConvexClientProvider>{children}</ConvexClientProvider>
          {/* Page-transition loader. SSR'd visible on cold loads, fades out
              once the first page's critical images are decoded; <TransitionLink>
              + useStartPageTransition trigger it on in-app navs. Suppresses
              itself on /admin*. */}
          <TransitionOverlay />
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

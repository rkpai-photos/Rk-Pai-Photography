// Single source of truth for site-wide identity + SEO defaults. Imported by
// the root layout, every page's generateMetadata, sitemap.ts, robots.ts, the
// OG-image generators, and the JSON-LD helpers — change once → propagates.

export const siteUrl = "https://www.rkpai.in";
export const siteName = "Rk Pai Photography";
export const siteLocale = "en_IN";
export const siteLanguage = "en-IN";

export const defaultTitle =
  "Rk Pai Photography — Wildlife & Bird Photography by RK Pai";
/** Title pattern child pages slot into via `metadata: { title: "Stories" }`. */
export const titleTemplate = "%s · Rk Pai Photography";

export const defaultDescription =
  "Wildlife and bird photography by RK Pai. Story-driven photographs from the field — patience, passion, and a deep connection with the natural world.";

export const defaultKeywords = [
  "RK Pai",
  "RK Pai photography",
  "wildlife photography",
  "bird photography",
  "nature photography",
  "wildlife photographer India",
];

/** schema.org Person object used in JSON-LD across the site. */
export const person = {
  "@type": "Person" as const,
  name: "RK Pai",
  jobTitle: "Wildlife Photographer",
  email: "rkpaiin@gmail.com",
  url: siteUrl,
  description:
    "Wildlife photographer capturing birds, wildlife, and moments from nature that inspire peace, wonder, and conservation.",
  sameAs: [
    "https://www.facebook.com/rkpaiin/",
    "https://www.instagram.com/rk.pai/",
  ],
};

/** Build an absolute URL from a leading-slash path (or pass a path with no
 *  slash and we'll prepend one). */
export const absoluteUrl = (path: string): string =>
  `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

import type { Metadata } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { featherFables, pageUrl } from "@/data/books";

export const metadata: Metadata = {
  title: "Feather Fables",
  description: `Read ${featherFables.title} online — ${featherFables.subtitle}. A wildlife photography book by ${featherFables.author}.`,
  alternates: { canonical: "/feather-fables" },
  openGraph: {
    title: "Feather Fables",
    description: `${featherFables.subtitle} — a wildlife photography book by ${featherFables.author}.`,
    type: "book",
    url: "/feather-fables",
    images: [{ url: pageUrl(featherFables, featherFables.coverPage) }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Feather Fables",
    description: featherFables.subtitle,
  },
};

// Scoped Google Analytics: loads only on /feather-fables* and only when a
// measurement id is configured. trackEvent() (src/lib/analytics.ts) fires the
// reader's custom events through the gtag this mounts.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function FeatherFablesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </>
  );
}

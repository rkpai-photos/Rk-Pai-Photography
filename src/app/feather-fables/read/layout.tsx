import type { Metadata } from "next";

// The reader is an immersive fullscreen overlay (no Header/Footer) and is a
// per-page (?page=N) view, so keep it out of the index; canonical is the landing.
export const metadata: Metadata = {
  title: "Read — Feather Fables",
  robots: { index: false, follow: true },
  alternates: { canonical: "/feather-fables" },
};

export default function ReadLayout({ children }: { children: React.ReactNode }) {
  return children;
}

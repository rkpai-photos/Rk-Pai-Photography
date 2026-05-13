// /album/page.jsx is a "use client" component (R3F <Canvas>), and client
// components can't export `metadata`. So the per-route SEO metadata for /album
// lives here in a server-component layout instead.

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Albums",
  description:
    "An interactive 3D photo book — flip through selected wildlife and bird photographs by RK Pai.",
  alternates: { canonical: "/album" },
  openGraph: {
    title: "Albums",
    description:
      "An interactive 3D photo book — flip through selected wildlife and bird photographs by RK Pai.",
    type: "website",
    url: "/album",
  },
  twitter: {
    card: "summary_large_image",
    title: "Albums",
    description:
      "An interactive 3D photo book of wildlife and bird photographs.",
  },
};

export default function AlbumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

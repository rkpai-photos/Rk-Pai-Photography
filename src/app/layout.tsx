import type { Metadata } from "next";
import "./globals.css";
import { Archivo } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import TransitionOverlay from "@/components/TransitionOverlay";

const archivo = Archivo({
  display: "swap",
  weight: "variable",
  subsets: ["latin"],
  variable: "--font-archivo",
});

export const metadata: Metadata = {
  title: "Rk Pai Photography",
  description:
    "Immerse yourself in the beauty of the wildlife through breathtaking photography. Each image tells a story, celebrating the raw power, grace, and spirit of wildlife across the globe.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en">
        <head>
          <link rel="icon" href="/favicon.ico" />
        </head>
        <body
          className={`antialiased bg-stone-200 text-stone-900 ${archivo.variable} font-sans`}
        >
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

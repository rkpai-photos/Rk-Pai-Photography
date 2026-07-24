"use client";

import { ReactNode } from "react";
import { ConvexReactClient } from "convex/react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";

// Set NEXT_PUBLIC_CONVEX_URL in .env.local — `npx convex dev` writes it for you.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // No URL configured (e.g. a build before `convex dev` has run): render children
  // bare. The public pages use server-side `fetchQuery` and don't need this; only
  // /admin (Convex Auth + useMutation/useQuery) does.
  if (!convex) return <>{children}</>;
  return <ConvexAuthNextjsProvider client={convex}>{children}</ConvexAuthNextjsProvider>;
}

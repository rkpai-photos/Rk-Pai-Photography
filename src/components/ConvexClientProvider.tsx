"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Set NEXT_PUBLIC_CONVEX_URL in .env.local — `npx convex dev` writes it for you.
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  // If the env var is missing (e.g. during a build before `convex dev` has run),
  // render children without the provider. Server components that use `fetchQuery`
  // still work via NEXT_PUBLIC_CONVEX_URL; only client `useQuery`/`useMutation`
  // (the /admin page) need this provider.
  if (!convex) return <>{children}</>;
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

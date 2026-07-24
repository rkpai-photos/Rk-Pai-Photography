import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Admin · RK Pai Photography",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      {/* Sonner toast renderer — scoped to /admin* since the public site has
          no need for it. Drops in here rather than the root layout so the
          toast portal isn't mounted on every public page. */}
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

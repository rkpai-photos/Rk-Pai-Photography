"use client";

// Photo admin entry point. Three states:
//   • <AuthLoading> — spinner while Convex Auth resolves the session.
//   • <Unauthenticated> — sign-in prompt linking to /admin/login. (The proxy
//     in src/proxy.ts already redirects unauthenticated GETs here, but the
//     gate is a belt-and-braces fallback for the React layer.)
//   • <Authenticated> — the actual <Dashboard/> (photo grid + form sheet +
//     delete dialog), in src/app/admin/_components/Dashboard.tsx.
//
// Write authorization (ADMIN_EMAILS allow-list) is enforced inside the Convex
// mutations themselves — being signed in is necessary but not sufficient. The
// Dashboard surfaces those "Not authorized" failures via toast.

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import Link from "next/link";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import Dashboard from "./_components/Dashboard";

export default function AdminPage() {
  return (
    <>
      <AuthLoading>
        <main className="min-h-screen flex items-center justify-center bg-stone-100">
          <div className="size-8 rounded-full border-2 border-stone-300 border-t-stone-900 animate-spin" />
        </main>
      </AuthLoading>
      <Unauthenticated>
        <main className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
          <div className="w-full max-w-sm bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
            <div className="size-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center">
              <Camera className="w-6 h-6 text-stone-500" />
            </div>
            <h1 className="text-xl font-semibold text-stone-900">
              Sign in to continue
            </h1>
            <p className="text-sm text-stone-500">
              You need to sign in to manage photos.
            </p>
            <Button asChild className="w-full">
              <Link href="/admin/login">Go to sign in</Link>
            </Button>
          </div>
        </main>
      </Unauthenticated>
      <Authenticated>
        <Dashboard />
      </Authenticated>
    </>
  );
}

"use client";

// Convex Auth sign-in for /admin. Email + password.
// The admin account is created once via the "create account" flow; after that,
// being able to *write photos* still requires the email to be on the
// ADMIN_EMAILS allow-list on the Convex deployment (see convex/photos.ts).

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function AdminLoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      await signIn("password", {
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
        flow: mode,
      });
      router.push("/admin");
    } catch {
      setError(
        mode === "signIn"
          ? "Sign-in failed — check the email and password."
          : "Couldn't create the account (it may already exist, or the password is too weak).",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-200 p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white border border-stone-300 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <h1 className="text-xl font-semibold text-stone-900">Photo admin</h1>
        <p className="text-sm text-stone-600">
          {mode === "signIn"
            ? "Sign in to manage photos."
            : "Create the admin account (one-time setup)."}
        </p>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          autoFocus
          className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-stone-50 outline-none focus:border-stone-500"
        />
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          autoComplete={mode === "signIn" ? "current-password" : "new-password"}
          className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-stone-50 outline-none focus:border-stone-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          {busy ? "…" : mode === "signIn" ? "Sign in" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signIn" ? "signUp" : "signIn");
            setError(null);
          }}
          className="w-full text-sm text-stone-500 underline hover:text-stone-700"
        >
          {mode === "signIn" ? "First time? Create the admin account" : "Have an account? Sign in"}
        </button>
      </form>
    </main>
  );
}

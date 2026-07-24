"use client";

// Convex Auth sign-in for /admin. Email + password, sign-in only.
// Self-service sign-up is intentionally not offered here, and the Password
// provider in convex/auth.ts also rejects sign-up server-side for any email not
// on the ADMIN_EMAILS allow-list. The admin account is created out-of-band:
//   npx convex run setup:createAdmin '{"email":"...","password":"..."}'

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function AdminLoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      await signIn("password", {
        email: String(data.get("email") || "").trim(),
        password: String(data.get("password") || ""),
        flow: "signIn",
      });
      router.push("/admin");
    } catch {
      setError("Sign-in failed — check the email and password.");
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
        <p className="text-sm text-stone-600">Sign in to manage photos.</p>
        <input
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete="email"
          autoFocus
          className="w-full h-11 px-3 rounded-lg border border-stone-300 bg-stone-50 outline-none focus:border-stone-500"
        />
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            required
            placeholder="Password"
            autoComplete="current-password"
            className="w-full h-11 pl-3 pr-11 rounded-lg border border-stone-300 bg-stone-50 outline-none focus:border-stone-500"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-stone-400 hover:text-stone-700"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full h-11 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          {busy ? "…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}

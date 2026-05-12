// Convex Auth — session-based auth for the /admin dashboard.
// Email + password. Self-service sign-up is OFF: only an email already on the
// ADMIN_EMAILS allow-list (the same list used for write authorization in
// convex/photos.ts) is allowed to create an account, and the /admin/login UI
// doesn't expose a sign-up affordance at all — the `profile` check below is the
// server-side backstop. The admin account is bootstrapped out-of-band via
// `npx convex run setup:createAdmin '{"email":"...","password":"..."}'`.
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (params.flow === "signUp" && !adminEmails().includes(email)) {
          throw new Error("Sign-up is disabled.");
        }
        return { email };
      },
    }),
  ],
});

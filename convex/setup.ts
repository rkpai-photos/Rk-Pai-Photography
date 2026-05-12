// One-time admin bootstrap. The password is passed as an argument — it is never
// stored in source, in env vars, or anywhere in the repo.
//
//   npx convex run setup:createAdmin '{"email":"you@example.com","password":"<password>"}'
//
// After the account exists, make sure that email is in the write allow-list:
//   npx convex env set ADMIN_EMAILS "you@example.com"
//
// (`createAccount` bypasses the Password provider's sign-up gate in convex/auth.ts
// on purpose — that gate is for the public sign-up flow, not this admin path.)
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { createAccount } from "@convex-dev/auth/server";

export const createAdmin = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const normalized = email.trim().toLowerCase();
    if (!normalized || !password) throw new Error("email and password are required");
    try {
      await createAccount(ctx, {
        provider: "password",
        account: { id: normalized, secret: password },
        profile: { email: normalized },
      });
      return `Created admin account: ${normalized}`;
    } catch (e: any) {
      if (String(e?.message ?? e).toLowerCase().includes("already exists")) {
        return `Account already exists: ${normalized}`;
      }
      throw e;
    }
  },
});

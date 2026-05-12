// Convex Auth — session-based auth for the /admin dashboard.
// Email + password provider. There is no public sign-up affordance in the UI;
// the admin account is created once (see CONTEXT.md §10), and *authorization*
// (who may write photos) is enforced separately by the ADMIN_EMAILS allow-list
// in convex/photos.ts — being authenticated is necessary but not sufficient.
import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

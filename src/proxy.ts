// Next 16 renamed the `middleware` file convention to `proxy` (same runtime
// contract: a single default-exported handler + an optional `config` matcher;
// see https://nextjs.org/docs/app/api-reference/file-conventions/proxy).
// Convex Auth's `convexAuthNextjsMiddleware` returns a standard Next.js handler,
// so it works here unchanged. MUST live at `src/proxy.ts` (not the repo root)
// because this project uses a `src/` dir — Next.js ignores a root-level one here.
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

const isAdminLogin = createRouteMatcher(["/admin/login"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  const authed = await convexAuth.isAuthenticated();

  // Already signed in? Don't show the login page.
  if (isAdminLogin(request) && authed) {
    return nextjsMiddlewareRedirect(request, "/admin");
  }
  // Any /admin route except the login page requires a session.
  if (isAdminRoute(request) && !isAdminLogin(request) && !authed) {
    return nextjsMiddlewareRedirect(request, "/admin/login");
  }
});

export const config = {
  // Run on everything except Next internals and static files (the matcher must
  // include /api/auth so the proxy can forward Convex Auth's HTTP routes).
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

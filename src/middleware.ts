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
  // include /api/auth so the middleware can proxy Convex Auth's HTTP routes).
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

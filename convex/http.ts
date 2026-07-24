import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Registers /.well-known/openid-configuration, /.well-known/jwks.json,
// and (if OAuth providers are configured) /api/auth/*.
auth.addHttpRoutes(http);

export default http;

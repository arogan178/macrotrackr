// src/middleware/auth.ts
import { Elysia, type Static } from "elysia";
import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { AuthSchemas } from "../modules/auth/schemas";
import { config } from "../config";
import { AuthenticationError } from "../lib/errors";
import { loggerHelpers } from "../lib/logger";

// Define paths exempt from authentication checks
const AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/validate-email",
  "/api/docs",
  "/api/docs/json",
  "/",
  "/health",
  "/health/ready",
]);

/**
 * Check if a path is exempt from authentication
 */
function isExemptPath(path: string): boolean {
  return AUTH_EXEMPT_PATHS.has(path);
}

/**
 * Extract token from Authorization header
 */
function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

/**
 * Elysia plugin for JWT authentication with simplified logic
 */
export const authMiddleware = new Elysia({ name: "authMiddleware" })
  // Setup JWT plugin
  .use(
    jwtPlugin({
      name: "jwt",
      secret: config.JWT_SECRET,
      exp: "7d",
      schema: AuthSchemas.jwtPayload,
    })
  )
  // Derive user information from JWT
  .derive({ as: "scoped" }, async ({ jwt, request, path }) => {
    // Skip authentication for exempt paths
    if (isExemptPath(path)) {
      return { user: null };
    }

    const token = extractToken(request.headers.get("authorization"));
    if (!token) {
      return { user: null };
    }

    try {
      const payload = await jwt.verify(token);
      return { user: payload as AuthenticatedUserPayload };
    } catch (error) {
      if (config.NODE_ENV === "development") {
        loggerHelpers.auth(
          "jwt_verification_failed",
          undefined,
          undefined,
          false
        );
      }
      return { user: null };
    }
  })
  // Authentication guard
  .onBeforeHandle({ as: "scoped" }, ({ user, path }) => {
    if (isExemptPath(path)) {
      return; // Allow exempt paths
    }

    if (!user) {
      throw new AuthenticationError("Authentication required. Please log in.");
    }
  });

// Export types
export type AuthenticatedUserPayload = Static<typeof AuthSchemas.jwtPayload>;

export type AuthenticatedContext = {
  user: AuthenticatedUserPayload;
  db: import("bun:sqlite").Database;
  jwt: ReturnType<typeof jwtPlugin>["decorator"]["jwt"];
  set: any;
};

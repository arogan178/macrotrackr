// src/middleware/auth.ts
import type { Database } from "bun:sqlite";
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
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

/**
 * Extract JWT token from cookies (if present)
 */
function extractTokenFromCookies(
  cookieHeader: string | null,
  cookieName = "jwt"
): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith(cookieName + "=")) {
      return cookie.slice(cookieName.length + 1);
    }
  }
  return null;
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
      exp: config.JWT_EXP,
      schema: AuthSchemas.jwtPayload,
    })
  )
  // Derive user information from JWT
  .derive({ as: "scoped" }, async ({ jwt, request, path }) => {
    // Skip authentication for exempt paths
    if (isExemptPath(path)) {
      return { user: null };
    }

    // Try to extract JWT from Authorization header first
    let token = extractToken(request.headers.get("authorization"));
    // If not found, try to extract from cookies (cookie name: 'jwt')
    if (!token) {
      token = extractTokenFromCookies(request.headers.get("cookie"), "jwt");
    }
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

export interface AuthenticatedContext {
  user: AuthenticatedUserPayload;
  db: Database;
  jwt: ReturnType<typeof jwtPlugin>["decorator"]["jwt"];
  set: {
    headers: Record<string, string>;
    status?: number;
  };
  request: Request;
  path: string;
  query: Record<string, string | undefined>;
}

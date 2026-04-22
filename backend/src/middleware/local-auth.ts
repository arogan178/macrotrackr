import { Elysia } from "elysia";
import type { Database } from "bun:sqlite";

import { resolveSession } from "../lib/auth/session";
import { logger } from "../lib/observability/logger";

const LOCAL_AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/session",
  "/api/auth/clerk-sync",
  "/api/docs",
  "/api/docs/json",
  "/",
  "/health",
  "/health/ready",
  "/metrics",
  "/metrics/queries",
]);

function getRequestPath(context: { request?: Request; path?: string }): string {
  const requestUrl = context.request?.url;

  if (typeof requestUrl === "string" && requestUrl.length > 0) {
    try {
      return new URL(requestUrl).pathname;
    } catch {
      // Fall through to context.path.
    }
  }

  return context.path ?? "";
}

export function isLocalAuthExemptPath(path: string): boolean {
  if (LOCAL_AUTH_EXEMPT_PATHS.has(path)) {
    return true;
  }

  if (path.startsWith("/api/docs") || path.startsWith("/api/api/docs")) {
    return true;
  }

  return false;
}

export const localAuthMiddleware = new Elysia({ name: "local-auth" })
  .resolve(
    { as: "scoped" },
    (context: {
      db?: Database;
      request?: Request;
      path?: string;
    }) => {
      const { db, request } = context;
      if (!db || !request) {
        return {
          user: null,
          authenticatedUser: null,
          authProvider: "local" as const,
        };
      }

      const session = resolveSession(db, request);
      if (!session) {
        return {
          user: null,
          authenticatedUser: null,
          authProvider: "local" as const,
        };
      }

      const authenticatedUser = {
        userId: session.userId,
        providerUserId: String(session.userId),
        authProvider: "local" as const,
        sessionId: session.sessionId,
        email: session.user.email,
        firstName: session.user.first_name,
        lastName: session.user.last_name,
      };

      return {
        user: authenticatedUser,
        authenticatedUser,
        authProvider: "local" as const,
      };
    },
  )
  .onBeforeHandle({ as: "scoped" }, (context) => {
    const typedContext = context as {
      user: { userId?: number | null; sessionId?: string } | null;
      path?: string;
      request?: Request;
      set: {
        status?: number | string;
      };
    };

    const requestPath = getRequestPath(typedContext);
    if (isLocalAuthExemptPath(requestPath)) {
      return;
    }

    if (!typedContext.user?.userId) {
      logger.warn(
        { path: typedContext.path, requestPath },
        "Local auth required but session was not found",
      );
      typedContext.set.status = 401;
      return {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please sign in.",
      };
    }
  });

// src/middleware/clerk-auth.ts
import { clerkPlugin } from "elysia-clerk";
import { Elysia } from "elysia";
import { config } from "../config";
import { AuthIntegrationError } from "../lib/http/errors";
import { logger } from "../lib/observability/logger";
import { getInternalUserId } from "../lib/auth/clerk-utils";
import type { Database } from "bun:sqlite";

type ClerkAuthResult = {
  userId?: string;
  sessionId?: string | null;
};

type ClerkUserObject = {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
  primaryEmailAddressId?: string | null;
};

type ClerkContextObject = {
  getAuth?: (request?: Request) => unknown | Promise<unknown>;
  auth?: (request?: Request) => unknown | Promise<unknown>;
  users?: {
    getUser?: (userId: string) => Promise<ClerkUserObject>;
  };
};

// Define paths exempt from authentication checks.
const AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/reset-password",
  // Note: /api/auth/clerk-sync is NOT exempt - it needs auth to know which user to sync
  "/api/webhooks/clerk",
  "/api/billing/webhook",
  "/api/docs",
  "/api/docs/json",
  "/",
  "/health",
  "/health/ready",
  "/metrics",
  "/metrics/queries",
]);

// Paths that can be called before the Clerk account is linked to an internal DB user.
const UNLINKED_ALLOWED_PATHS = new Set([
  "/api/auth/clerk-sync",
]);

/**
 * Check if a path is exempt from authentication
 */
export function isExemptPath(path: string): boolean {
  // Check exact matches
  if (AUTH_EXEMPT_PATHS.has(path)) {
    return true;
  }
  
  // Check for webhook paths (they handle their own auth)
  if (path.startsWith("/api/webhooks/")) {
    return true;
  }
  
  // Check for Swagger/OpenAPI paths
  if (path.startsWith("/api/docs") || path.startsWith("/api/api/docs")) {
    return true;
  }
  
  return false;
}

function isAllowedForUnlinkedUser(path: string): boolean {
  if (UNLINKED_ALLOWED_PATHS.has(path)) {
    return true;
  }

  // Keep diagnostics path available while account linking is being established.
  if (path === "/api/user/me") {
    return true;
  }

  return false;
}

function getRequestPath(context: { request?: Request; path?: string }): string {
  const requestUrl = context.request?.url;

  if (typeof requestUrl === "string" && requestUrl.length > 0) {
    try {
      return new URL(requestUrl).pathname;
    } catch {
      // Fall through to context.path
    }
  }

  return context.path ?? "";
}

function getSafeHeaderSummary(request?: Request): Record<string, string> | "no headers" {
  if (!request?.headers) {
    return "no headers";
  }

  const summary: Record<string, string> = {};
  for (const [key, value] of request.headers.entries()) {
    const normalizedKey = key.toLowerCase();
    if (
      normalizedKey === "authorization" ||
      normalizedKey === "cookie" ||
      normalizedKey === "set-cookie"
    ) {
      summary[normalizedKey] = "[redacted]";
      continue;
    }
    summary[normalizedKey] = value;
  }

  return summary;
}

function getPrimaryClerkEmail(clerkUser: {
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
  primaryEmailAddressId?: string | null;
} | null): string | undefined {
  if (!clerkUser?.emailAddresses || clerkUser.emailAddresses.length === 0) {
    return undefined;
  }

  if (clerkUser.primaryEmailAddressId) {
    const primary = clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId,
    );
    if (primary?.emailAddress) {
      return primary.emailAddress;
    }
  }

  return clerkUser.emailAddresses[0]?.emailAddress;
}

/**
 * Clerk authentication middleware for Elysia
 * Validates Clerk JWT tokens and extracts user information
 */
export const clerkAuthMiddleware = new Elysia({ name: "clerkAuthMiddleware" })
  .use(
    clerkPlugin({
      publishableKey: config.CLERK_PUBLISHABLE_KEY,
      secretKey: config.CLERK_SECRET_KEY,
      // Optional: restrict authorized parties
      // authorizedParties: [config.CORS_ORIGIN as string],
    })
  )
  .resolve(
    { as: "scoped" },
    async (context: {
      auth?: unknown;
      clerk?: unknown;
      path?: string;
      db?: Database;
      request?: Request;
    }) => {
    const { auth, clerk, path, db, request } = context;
    const requestPath = getRequestPath(context);
    
    // Debug logging - only in development
    if (config.NODE_ENV === 'development') {
      logger.debug({ 
        path, 
        requestPath,
        hasAuth: !!auth, 
        authType: typeof auth,
        hasClerk: !!clerk,
        headers: getSafeHeaderSummary(request)
      }, "Clerk auth middleware called");
    }
    
    // Skip authentication for exempt paths
    if (isExemptPath(requestPath)) {
      if (config.NODE_ENV === 'development') {
        logger.debug({ path, requestPath }, "Skipping auth for exempt path");
      }
      return {
        user: null,
        authenticatedUser: null,
        clerkUserId: null,
        internalUserId: null,
      };
    }

    try {
      const authResult = auth as ClerkAuthResult | undefined;

      if (!authResult?.userId) {
        logger.warn({ path, requestPath }, "No valid Clerk session token found in context");
        return {
          user: null,
          authenticatedUser: null,
          clerkUserId: null,
          internalUserId: null,
        };
      }

      const userId = authResult.userId;

      // Fetch the full user object from Clerk if needed
      let clerkUser: ClerkUserObject | null = null;
      try {
        const clerkClient = clerk as ClerkContextObject | null;
        if (!clerkClient?.users?.getUser) {
          throw new AuthIntegrationError("Clerk users client is unavailable");
        }

        clerkUser = await clerkClient.users.getUser(userId);
      } catch (err) {
        logger.error({ userId, error: err }, "Failed to fetch Clerk user details");
        throw new AuthIntegrationError(
          "Failed to load Clerk user details",
        );
      }

      const email = getPrimaryClerkEmail(clerkUser);
      
      // Debug logging - only in development
      if (config.NODE_ENV === 'development') {
        logger.debug({ 
          path, 
          requestPath,
          userId, 
          email,
          firstName: clerkUser?.firstName 
        }, "User authenticated successfully");
      }

      // Look up internal user ID from database
      const internalUserId = db 
        ? getInternalUserId(db as Database, userId, email)
        : null;

      logger.debug({
        path,
        requestPath,
        clerkUserId: userId,
        email,
        internalUserId,
        hasDb: !!db
      }, "Clerk auth middleware - internal user ID lookup result");

      // Return user info for use in route handlers
      const authenticatedUser = {
          userId: internalUserId ?? undefined,
          id: userId,
          clerkUserId: userId,
          email,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          imageUrl: clerkUser?.imageUrl,
        };

      return {
        user: authenticatedUser,
        authenticatedUser,
        clerkUserId: userId,
        internalUserId,
        clerkClient: clerk,
      };
    } catch (err) {
      if (err instanceof AuthIntegrationError) {
        throw err;
      }

      logger.error({ error: err, path, requestPath }, "Clerk authentication error");
      throw new AuthIntegrationError("Clerk authentication middleware failed");
    }
    },
  )
  // Authentication guard - must be after the derive to check if user exists
  .onBeforeHandle({ as: "scoped" }, (context) => {
    const typedContext = context as {
      user: ClerkAuthContext["user"];
      internalUserId: number | null;
      path?: string;
      set: {
        status?: number | string;
      };
      request?: Request;
    };

    const { user, internalUserId, path, set } = typedContext;
    const requestPath = getRequestPath(context);
    
    // Skip authentication for exempt paths
    if (isExemptPath(requestPath)) {
      return;
    }

    // Require authentication for all other paths
    if (!user) {
      logger.warn({ path, requestPath }, "Authentication required but no user found");
      set.status = 401;
      return {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please sign in.",
      };
    }

    if (!internalUserId && !isAllowedForUnlinkedUser(requestPath)) {
      logger.warn(
        { path, requestPath, clerkUserId: user?.clerkUserId },
        "Authenticated Clerk user is not linked to an internal account",
      );
      set.status = 409;
      return {
        code: "ACCOUNT_NOT_SYNCED",
        message:
          "Your account is not linked yet. Please retry sign-in so we can finish setup.",
      };
    }
  });

// Export types
export interface ClerkAuthContext {
  user: {
    userId?: number | null;
    id: string;
    clerkUserId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  authenticatedUser: {
    userId?: number | null;
    id: string;
    clerkUserId: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
  } | null;
  clerkUserId: string | null;
  internalUserId: number | null;
  clerkClient?: unknown;
}

// src/middleware/clerkAuth.ts
import { clerkPlugin, verifyToken } from "elysia-clerk";
import { Elysia } from "elysia";
import { config } from "../config";
import { logger } from "../lib/logger";
import { getInternalUserId } from "../lib/clerk-utils";
import type { Database } from "bun:sqlite";

// Define paths exempt from authentication checks
// Note: Login and register paths removed - now handled by Clerk
const AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/validate-email",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  // Note: /api/auth/clerk-sync is NOT exempt - it needs auth to know which user to sync
  "/api/webhooks/clerk",
  "/api/webhooks/stripe",
  "/api/docs",
  "/api/docs/json",
  "/",
  "/health",
  "/health/ready",
]);

// Paths that can be called before the Clerk account is linked to an internal DB user.
const UNLINKED_ALLOWED_PATHS = new Set([
  "/api/auth/clerk-sync",
]);

/**
 * Check if a path is exempt from authentication
 */
function isExemptPath(path: string): boolean {
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
  .resolve({ as: "scoped" }, async (context: any) => {
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
        headers: request?.headers ? Object.fromEntries(request.headers.entries()) : 'no headers'
      }, "Clerk auth middleware called");
    }
    
    // Skip authentication for exempt paths
    if (isExemptPath(requestPath)) {
      if (config.NODE_ENV === 'development') {
        logger.debug({ path, requestPath }, "Skipping auth for exempt path");
      }
      return { user: null, clerkUserId: null, internalUserId: null };
    }

    try {
      const resolveBearerToken = () => {
        const authHeader = request?.headers?.get("authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return null;
        }
        const token = authHeader.slice(7).trim();
        return token.length > 0 ? token : null;
      };

      const verifyBearerTokenFallback = async () => {
        const token = resolveBearerToken();
        if (!token) {
          return null;
        }

        try {
          const verified = await verifyToken(token, {
            secretKey: config.CLERK_SECRET_KEY,
          });

          const fallbackUserId =
            verified && typeof verified.sub === "string" ? verified.sub : null;
          if (!fallbackUserId) {
            return null;
          }

          return {
            userId: fallbackUserId,
            sessionId:
              verified && typeof verified.sid === "string"
                ? verified.sid
                : null,
          };
        } catch (error) {
          logger.warn(
            { path, requestPath, error },
            "Bearer token verification fallback failed"
          );
          return null;
        }
      };

      const resolveAuth = async () => {
        if (typeof auth === "function") {
          return auth();
        }

        // In some Elysia lifecycles, auth can already be the resolved auth object.
        if (auth && typeof auth === "object") {
          return auth;
        }

        const clerkClient = clerk as Record<string, any> | null;
        if (!clerkClient) {
          return null;
        }

        if (typeof clerkClient.getAuth === "function") {
          return clerkClient.getAuth(request);
        }

        if (typeof clerkClient.auth === "function") {
          return clerkClient.auth(request);
        }

        logger.warn(
          { path, requestPath },
          "No compatible Clerk auth resolver found on context"
        );
        return null;
      };

      let authResult = await resolveAuth();

      if (!authResult?.userId) {
        const fallbackAuthResult = await verifyBearerTokenFallback();
        if (fallbackAuthResult) {
          authResult = fallbackAuthResult;
        }
      }

      if (!authResult) {
        logger.warn({ path, requestPath }, "No auth function available in context");
        return { user: null, clerkUserId: null, internalUserId: null };
      }

      const userId = authResult?.userId;
      
      // Debug logging - only in development
      if (config.NODE_ENV === 'development') {
        logger.debug({ 
          path, 
          requestPath,
          userId, 
          sessionId: authResult?.sessionId,
          hasAuthResult: !!authResult 
        }, "Auth function called");
      }
      
      if (!userId) {
        logger.warn(
          { path, requestPath, authResult },
          "No userId in auth result - no valid Clerk session token found"
        );
        return { user: null, clerkUserId: null, internalUserId: null };
      }

      // Fetch the full user object from Clerk if needed
      let clerkUser = null;
      try {
        clerkUser = await clerk.users.getUser(userId);
      } catch (err) {
        logger.warn({ userId, error: err }, "Failed to fetch Clerk user details");
      }

      const email = clerkUser?.emailAddresses?.[0]?.emailAddress;
      
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
      return {
        user: {
          userId: internalUserId ?? undefined,
          id: userId,
          clerkUserId: userId,
          email,
          firstName: clerkUser?.firstName,
          lastName: clerkUser?.lastName,
          imageUrl: clerkUser?.imageUrl,
        },
        clerkUserId: userId,
        internalUserId,
        clerkClient: clerk,
      };
    } catch (err) {
      logger.error({ error: err, path, requestPath }, "Clerk authentication error");
      return { user: null, clerkUserId: null, internalUserId: null };
    }
  })
  // Authentication guard - must be after the derive to check if user exists
  .onBeforeHandle({ as: "scoped" }, (context: any) => {
    const { user, internalUserId, path, set } = context;
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
  clerkUserId: string | null;
  internalUserId: number | null;
  clerkClient?: any;
}

/**
 * Legacy adapter type for backward compatibility
 * Maps Clerk auth to the old AuthenticatedContext structure
 */
export interface LegacyAuthAdapter {
  user: {
    userId: number;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
}

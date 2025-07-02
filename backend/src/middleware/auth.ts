// src/middleware/auth.ts
import { Elysia, type Static } from "elysia"; // Removed named Error imports
import { jwt as jwtPlugin } from "@elysiajs/jwt";
import { AuthSchemas } from "../modules/auth/schemas"; // Import JWT payload schema
import { config } from "../config"; // Import validated config

// Define paths exempt from authentication checks
const AUTH_EXEMPT_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register", // Changed from register-complete for consistency
  "/api/auth/validate-email",
  "/api/docs", // Exempt Swagger UI path
  "/api/docs/json", // Exempt Swagger JSON path
  "/", // Exempt root path if it's public
  // Add other public paths like '/api/health' if needed
]);

/**
 * Elysia plugin encapsulating JWT setup and authentication guard logic.
 * Uses set.status and generic Error for compatibility.
 */
export const authMiddleware = new Elysia({ name: "authMiddleware" })
  // 1. Setup JWT plugin using validated config
  .use(
    jwtPlugin({
      name: "jwt", // Namespace for jwt functions (e.g., ctx.jwt.sign)
      secret: config.JWT_SECRET, // Use secret from validated config
      exp: "7d", // Token expiration time
      schema: AuthSchemas.jwtPayload, // Validate JWT payload structure during verification
    })
  )
  // 2. Derive user information from JWT (scoped to run only once per request)
  .derive({ as: "scoped" }, async ({ jwt, request, path }) => {
    // Skip derivation for exempt paths to avoid unnecessary token checks
    if (AUTH_EXEMPT_PATHS.has(path)) {
      return { user: null }; // Indicate no authenticated user for exempt paths
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { user: null }; // No valid Authorization header found
    }

    const token = authHeader.slice(7); // Extract token part

    try {
      // Verify the token and validate its payload against the JWT schema
      const payload = await jwt.verify(token);
      if (!payload) {
        // This case is unlikely if verify succeeds and schema matches, but good practice
        return { user: null };
      }
      // Successfully verified, return the payload (contains userId, email, etc.)
      return { user: payload as AuthenticatedUserPayload }; // Cast to defined type
    } catch (error) {
      // Handle verification errors (expired, invalid signature, format issues)
      // Log for debugging but treat as unauthenticated
      if (config.NODE_ENV === "development") {
        // Log details only in dev
        console.warn(
          `JWT verification failed for path ${path}:`,
          error instanceof Error ? error.message : error
        );
      }
      return { user: null };
    }
  })
  // 3. Global Authentication Guard (runs before route handlers)
  .onBeforeHandle({ as: "scoped" }, ({ user, path, set }) => {
    // Added 'set' to context
    // Allow requests to exempt paths regardless of authentication status
    if (AUTH_EXEMPT_PATHS.has(path)) {
      return; // Proceed to the handler
    }

    // If the path is *not* exempt, a valid 'user' object derived from JWT is REQUIRED
    if (!user) {
      // Use set.status and throw generic Error instead of UnauthorizedError
      set.status = 401; // Unauthorized
      throw new Error("Authentication required. Please log in.");
    }

    // If user exists for a protected route, execution continues to the handler.
    // The 'user' object (AuthenticatedUserPayload) is available in the handler context.
  });

// Define a type alias for the validated JWT payload structure for cleaner type hinting
export type AuthenticatedUserPayload = Static<typeof AuthSchemas.jwtPayload>;

// Define a type for the context object after the middleware runs, used in routes
// Ensure 'set' is included if routes need it for error handling
export type AuthenticatedContext = {
  user: AuthenticatedUserPayload; // User is guaranteed to be non-null in protected routes
  // Include other context properties like db, jwt etc. as needed by routes
  db: import("bun:sqlite").Database;
  jwt: ReturnType<typeof jwtPlugin>["decorator"]["jwt"];
  set: Elysia.Set; // Include set for status manipulation
};

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import type { Database } from "bun:sqlite";
import { config } from "./config";
import { clerkAuthMiddleware } from "./middleware/clerk-auth";
import { rateLimiters } from "./middleware/rate-limit";
import { requestLimitsMiddleware } from "./middleware/request-limits";
import {
  correlationMiddleware,
  enhancedApiLogging,
} from "./middleware/correlation";
import { handleError } from "./lib/responses";
import { isAppError } from "./lib/errors";
import { logger } from "./lib/logger";

// Import route modules
import { authRoutes, clerkWebhookHandler } from "./modules/auth";
import { billingRoutes, webhookHandler } from "./modules/billing";
import { goalRoutes } from "./modules/goals";
import { habitRoutes } from "./modules/habits";
import { macroRoutes } from "./modules/macros";
import { reportingRoutes } from "./modules/reporting";
import { savedMealRoutes } from "./modules/saved-meals";
import { userRoutes } from "./modules/user";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";
import { recordRequest } from "./lib/metrics";

export function createApp(db: Database) {
  const app = new Elysia()
    // Request size limits for security
    .use(requestLimitsMiddleware)

    // Request timing middleware for metrics collection
    .onRequest((context: any) => {
      context.requestStartTime = Date.now();
    })

    .onAfterResponse((context: any) => {
      const { request, set } = context;
      const start =
        typeof context.requestStartTime === "number"
          ? context.requestStartTime
          : Date.now();
      const duration = Date.now() - start;
      const path = new URL(request.url).pathname;
      const statusCode =
        typeof set?.status === "number" ? set.status : 200;

      recordRequest(request.method, path, statusCode, duration);
    })

    // Global middleware & plugins
    .use(
      cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      })
    );

  // Only enable Swagger docs if not in production
  if (config.NODE_ENV !== "production") {
    app.use(
      swagger({
        path: "/api/docs",
        documentation: {
          info: {
            title: "Macro Trackr API",
            version: "1.0.0",
            description: "API for tracking macronutrients and user goals.",
          },
        },
      })
    );
    // Alias for Swagger UI bug: serve /api/api/docs/json as /api/docs/json
    app.get("/api/api/docs/json", ({ set }: any) => {
      set.status = 302;
      set.headers["Location"] = "/api/docs/json";
      return;
    });
  }

  app
    // Context decorators (add early for webhook access)
    .decorate("db", db)

    // Webhook routes (NO AUTH) - MUST be before middleware that consumes body
    .use(webhookHandler)

    // Clerk webhook handler (NO AUTH) - handles user sync from Clerk
    .use(clerkWebhookHandler)

    // Apply middleware after webhook routes to avoid body consumption conflicts
    .use(correlationMiddleware)
    .use(enhancedApiLogging)

    // Apply rate limiting
    .use(rateLimiters.api)

    // Apply Clerk auth middleware globally (it has path exemptions built-in)
    // This must run before routes that depend on Clerk user context (e.g. /api/auth/clerk-sync)
    .use(clerkAuthMiddleware)

    // Public auth routes (password reset + Clerk sync)
    .use(authRoutes)

    // All other routes
    .use(userRoutes)
    .use(macroRoutes)
    .use(goalRoutes)
    .use(habitRoutes)
    .use(billingRoutes)
    .use(reportingRoutes)
    .use(savedMealRoutes)

    // Health check routes (public, no auth)
    .use(healthRoutes)

    // Metrics endpoint (public, no auth) - Prometheus-compatible
    .use(metricsRoutes)

    // Global error handling
    .onError(({ code, error, set, path }: any) => {
      logger.error(
        {
          type: "elysia_error",
          code,
          error: error instanceof Error ? error : new Error(String(error)),
        },
        `[${code}] ${error?.toString() || "Unknown error"}`
      );

      // Always set JSON content type for API routes
      set.headers = set.headers || {};
      if (typeof path === "string" && path.startsWith("/api/")) {
        set.headers["Content-Type"] = "application/json";
      }

      // Handle AppError instances
      if (isAppError(error)) {
        return handleError(error, set);
      }

      // Handle Elysia validation errors
      if (code === "VALIDATION") {
        set.status = 400;
        return {
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: error instanceof Error ? error.message : String(error),
        };
      }

      // Map other Elysia codes
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        CONFLICT: 409,
        NOT_IMPLEMENTED: 501,
        INTERNAL_SERVER_ERROR: 500,
      };

      const statusCode = statusMap[code] || 500;
      set.status = statusCode;

      // Log stack trace for server errors
      if (statusCode >= 500 && error instanceof Error) {
        logger.error({ error, stack: error.stack }, "Server error stack trace");
      }

      return {
        code: code || "INTERNAL_ERROR",
        message:
          error instanceof Error ? error.message : "An unexpected error occurred",
        ...(config.NODE_ENV !== "production" &&
          statusCode >= 500 &&
          error instanceof Error && {
            details: error.stack,
          }),
      };
    });

  return app;
}

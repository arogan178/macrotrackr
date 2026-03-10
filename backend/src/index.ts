// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { createDatabase, initializeDatabase } from "./db";
import { clerkAuthMiddleware } from "./middleware/clerkAuth";
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
import { authRoutes } from "./modules/auth/routes";
import { clerkWebhookHandler } from "./modules/auth/clerk-webhook";
import { userRoutes } from "./modules/user/routes";
import { macroRoutes } from "./modules/macros/routes";
import { goalRoutes } from "./modules/goals/routes";
import { habitRoutes } from "./modules/habits/routes";
import { billingRoutes } from "./modules/billing/routes";
import { reportingRoutes } from "./modules/reporting/routes";
import { savedMealRoutes } from "./modules/saved-meals/routes";
import { webhookHandler } from "./modules/billing/webhook-handler";
import { healthRoutes } from "./routes/health";
import { metricsRoutes } from "./routes/metrics";
import { recordRequest } from "./lib/metrics";

logger.info("Starting Elysia server...");

let db;

try {
  db = initializeDatabase(createDatabase());
} catch (error) {
  console.error("Fatal error during database initialization:", error);
  process.exit(1);
}

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

// Context decorators (add early for webhook access)
app.decorate("db", db);

// Webhook routes (NO AUTH) - MUST be before middleware that consumes body
app.use(webhookHandler);

// Clerk webhook handler (NO AUTH) - handles user sync from Clerk
app.use(clerkWebhookHandler);

// Apply middleware after webhook routes to avoid body consumption conflicts
app.use(correlationMiddleware);
app.use(enhancedApiLogging);

// Apply rate limiting
app.use(rateLimiters.api);

// Apply Clerk auth middleware globally (it has path exemptions built-in)
// This must run before routes that depend on Clerk user context (e.g. /api/auth/clerk-sync)
app.use(clerkAuthMiddleware);

// Public auth routes (password reset + Clerk sync)
app.use(authRoutes);

// All other routes
app.use(userRoutes);
app.use(macroRoutes);
app.use(goalRoutes);
app.use(habitRoutes);
app.use(billingRoutes);
app.use(reportingRoutes);
app.use(savedMealRoutes);

// Health check routes (public, no auth)
app.use(healthRoutes);

// Metrics endpoint (public, no auth) - Prometheus-compatible
app.use(metricsRoutes);

// Global error handling
app.onError(({ code, error, set, path }: any) => {
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

// Start server
app.listen({
  port: config.PORT,
  hostname: config.HOST,
});

logger.info(
  {
    type: "server_started",
    host: app.server?.hostname,
    port: app.server?.port,
    corsOrigin: config.CORS_ORIGIN,
    environment: config.NODE_ENV,
  },
  `Server listening on http://${app.server?.hostname}:${app.server?.port}`
);

logger.info(`    CORS Origin: ${config.CORS_ORIGIN}`);
logger.info(
  `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
);
logger.info(
  `    Clerk Authentication: Enabled`
);

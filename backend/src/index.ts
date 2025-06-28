// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { db } from "./db";
import { authMiddleware } from "./middleware/auth";
import { rateLimiters } from "./middleware/rate-limit";
import {
  correlationMiddleware,
  enhancedApiLogging,
} from "./middleware/correlation";
import { compressionMiddleware } from "./middleware/compression";
import { handleError } from "./lib/responses";
import { isAppError } from "./lib/errors";
import { logger } from "./lib/logger";

// Import route modules
import { authRoutes } from "./modules/auth/routes";
import { userRoutes } from "./modules/user/routes";
import { macroRoutes } from "./modules/macros/routes";
import { goalRoutes } from "./modules/goals/routes";
import { habitRoutes } from "./modules/habits/routes";

logger.info("🚀 Starting Elysia server...");

const app = new Elysia()
  // Request size limits for security
  .onRequest(({ request, set }) => {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1024 * 1024) {
      // 1MB limit
      set.status = 413;
      return {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body too large. Maximum size is 1MB.",
      };
    }
  })

  // Global middleware & plugins
  .use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    })
  )
  .use(
    swagger({
      path: "/api/docs",
      documentation: {
        info: {
          title: "Macro Tracker API",
          version: "1.0.0",
          description: "API for tracking macronutrients and user goals.",
        },
        tags: [
          { name: "System", description: "API status and documentation" },
          { name: "Auth", description: "User authentication and registration" },
          { name: "User", description: "User profile management and settings" },
          { name: "Macros", description: "Managing macro nutrient entries" },
          { name: "Goals", description: "Managing user goals" },
          { name: "Habits", description: "Managing user habits" },
        ],
      },
    })
  )

  // Apply correlation middleware for request tracing
  .use(correlationMiddleware)
  .use(enhancedApiLogging)

  // Apply response compression for performance
  .use(
    compressionMiddleware({
      threshold: 1024, // Compress responses > 1KB
      level: 6, // Balanced compression level
    })
  )

  // Apply rate limiting
  .use(rateLimiters.api)

  // Context decorators
  .decorate("db", db)

  // Authentication middleware
  .use(authMiddleware)

  // Mount route modules
  .use(authRoutes)
  .use(userRoutes)
  .use(macroRoutes)
  .use(goalRoutes)
  .use(habitRoutes)

  // Root endpoint
  .get(
    "/",
    () => ({
      status: "ok",
      message: "Macro Tracker API is running!",
      timestamp: new Date().toISOString(),
    }),
    {
      detail: { summary: "API Root / Health Check", tags: ["System"] },
    }
  )

  // Health check endpoint for monitoring
  .get(
    "/health",
    () => {
      try {
        // Test database connectivity
        const dbCheck = db.prepare("SELECT 1 as health").get() as
          | { health: number }
          | undefined;

        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: config.NODE_ENV,
          database: dbCheck?.health === 1 ? "connected" : "disconnected",
        };
      } catch (error) {
        logger.error({ error }, "Health check failed");
        return {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          version: "1.0.0",
          environment: config.NODE_ENV,
          database: "error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Health Check Endpoint for Load Balancers",
        tags: ["System"],
      },
    }
  )

  // Readiness probe for Kubernetes
  .get(
    "/health/ready",
    () => {
      try {
        // Check if all dependencies are ready
        const dbCheck = db.prepare("SELECT 1 as ready").get() as
          | { ready: number }
          | undefined;

        if (dbCheck?.ready === 1) {
          return { status: "ready", timestamp: new Date().toISOString() };
        } else {
          return { status: "not ready", reason: "database not ready" };
        }
      } catch (error) {
        logger.error({ error }, "Readiness check failed");
        return {
          status: "not ready",
          reason: "database error",
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    {
      detail: {
        summary: "Readiness Probe for Container Orchestration",
        tags: ["System"],
      },
    }
  )

  // Global error handling
  .onError(({ code, error, set }) => {
    logger.error(
      {
        type: "elysia_error",
        code,
        error: error instanceof Error ? error : new Error(String(error)),
      },
      `[${code}] ${error?.toString() || "Unknown error"}`
    );

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
  })

  // Start server
  .listen({
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
  `✅ Server listening on http://${app.server?.hostname}:${app.server?.port}`
);

logger.info(`    CORS Origin: ${config.CORS_ORIGIN}`);
logger.info(
  `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
);

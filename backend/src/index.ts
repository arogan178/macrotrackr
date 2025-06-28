// src/index.ts
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config";
import { db } from "./db";
import { authMiddleware } from "./middleware/auth";
import { handleError } from "./lib/responses";
import { isAppError } from "./lib/errors";

// Import route modules
import { authRoutes } from "./modules/auth/routes";
import { userRoutes } from "./modules/user/routes";
import { macroRoutes } from "./modules/macros/routes";
import { goalRoutes } from "./modules/goals/routes";
import { habitRoutes } from "./modules/habits/routes";

console.log("🚀 Starting Elysia server...");

const app = new Elysia()
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

  // Global error handling
  .onError(({ code, error, set }) => {
    console.error(`❌ [${code}] ${error?.toString() || "Unknown error"}`);

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
      console.error(error.stack);
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

console.log(
  `✅ Server listening on http://${app.server?.hostname}:${app.server?.port}`
);
console.log(`    CORS Origin: ${config.CORS_ORIGIN}`);
console.log(
  `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
);

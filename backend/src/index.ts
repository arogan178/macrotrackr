// src/index.ts
import { Elysia } from "elysia"; // Only import Elysia itself
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { config } from "./config"; // Import validated configuration
import { db } from "./db"; // Import initialized DB instance
import { authMiddleware } from "./middleware/auth"; // Import authentication middleware plugin

// Import route functions from modules
import { authRoutes } from "./modules/auth/routes";
import { userRoutes } from "./modules/user/routes";
import { macroRoutes } from "./modules/macros/routes";
import { goalRoutes } from "./modules/goals/routes";
import { habitRoutes } from "./modules/habits/routes"; // Import habit routes

console.log("🚀 Starting Elysia server...");

const app = new Elysia()
  // --- Global Middleware & Plugins ---
  .use(
    cors({
      // Apply CORS early
      origin: config.CORS_ORIGIN,
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // Add methods as needed
    })
  )
  // Optional: Swagger API documentation setup
  .use(
    swagger({
      path: "/api/docs",
      documentation: {
        info: {
          title: "Macro Tracker API",
          version: "1.0.0", // Update version as needed
          description: "API for tracking macronutrients and user goals.",
        },
        tags: [
          // Define tags used in route details for organization
          { name: "System", description: "API status and documentation" },
          { name: "Auth", description: "User authentication and registration" },
          { name: "User", description: "User profile management and settings" },
          { name: "Macros", description: "Managing macro nutrient entries" },
          { name: "Goals", description: "Managing user goals (Placeholder)" },
        ],
      },
      // Exclude internal Elysia routes from documentation if desired
      // exclude: ['/swagger', '/swagger/json']
    })
  )

  // --- Context Decorators ---
  // Make the database instance available in the context for all routes
  .decorate("db", db)

  // --- Authentication Middleware ---
  // Apply the auth middleware globally. It handles JWT verification and attaches 'user' to context.
  // It also enforces authentication for non-exempt routes.
  .use(authMiddleware)
  // --- Mount Routes from Modules ---
  // Pass the app instance to the route functions to attach their specific routes/groups
  .use(authRoutes)
  .use(userRoutes)
  .use(macroRoutes)
  .use(goalRoutes)
  .use(habitRoutes) // Mount habit routes

  // --- Root/Health Check Endpoint ---
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

  // --- Global Error Handling ---
  // This handler catches errors thrown anywhere in the application
  .onError(({ code, error, set }) => {
    console.error(`❌ [${code}] ${error.toString()}`); // Log the error code and message

    // Determine status code: Use the one set explicitly, or infer from Elysia's code
    let statusCode = 500; // Default to Internal Server Error
    if (set.status && set.status !== 200) {
      // Check if status was set before throwing
      statusCode = set.status;
    } else {
      // Map Elysia's internal error codes to HTTP status codes if status wasn't set explicitly
      switch (code) {
        case "VALIDATION":
          statusCode = 400;
          break;
        case "NOT_FOUND":
          statusCode = 404;
          break;
        // These should now be caught by set.status, but keep as fallback
        case "UNAUTHORIZED":
          statusCode = 401;
          break;
        case "FORBIDDEN":
          statusCode = 403;
          break;
        case "CONFLICT":
          statusCode = 409;
          break;
        case "NOT_IMPLEMENTED":
          statusCode = 501;
          break;
        case "INTERNAL_SERVER_ERROR":
          statusCode = 500;
          break;
        // Add other mappings as needed
      }
    }
    // Ensure status code is set on the response object
    set.status = statusCode;

    // Log stack trace for actual internal server errors
    if (statusCode >= 500 && code === "INTERNAL_SERVER_ERROR") {
      console.error(error.stack);
    }

    // --- Format Error Response ---
    // Always return a JSON error response
    let responseBody = {
      code: code, // Use Elysia's internal code or a custom one based on status
      message: error.message || "An unexpected error occurred.", // Use the error message
      details: undefined as any, // Add details field if needed
    };

    // Customize response body based on status code or original error code
    if (statusCode === 400) {
      responseBody.code = "VALIDATION_ERROR"; // More specific code for validation
      responseBody.message = "Input validation failed.";
      // Attempt to include structured validation details if available
      if (code === "VALIDATION") {
        try {
          const parsedDetails = JSON.parse(error.message);
          responseBody.details = parsedDetails;
        } catch {
          responseBody.details = error.message; // Fallback to raw message
        }
      } else {
        responseBody.details = error.message; // General bad request details
      }
    } else if (statusCode === 401) {
      responseBody.code = "AUTHENTICATION_ERROR";
    } else if (statusCode === 404) {
      responseBody.code = "NOT_FOUND";
    } else if (statusCode === 409) {
      responseBody.code = "RESOURCE_CONFLICT";
    } else if (statusCode === 501) {
      responseBody.code = "NOT_IMPLEMENTED";
    } else if (statusCode >= 500) {
      responseBody.code = "INTERNAL_ERROR";
      // Avoid leaking internal details in production
      if (config.NODE_ENV !== "production") {
        responseBody.details = error.stack; // Show stack in dev
      } else {
        responseBody.message = "An internal server error occurred."; // Generic message for prod
      }
    }

    return responseBody;
  })

  // --- Start the Server ---
  .listen({
    port: config.PORT,
    hostname: config.HOST, // Listen on specified host
  });

console.log(
  `✅ Server listening on http://${app.server?.hostname}:${app.server?.port}`
);
console.log(`    CORS Origin: ${config.CORS_ORIGIN}`);
console.log(
  `    API Docs: http://${app.server?.hostname}:${app.server?.port}/api/docs`
);

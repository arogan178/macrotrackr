// src/index.ts
import { Elysia, t } from "elysia";
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
import { billingRoutes } from "./modules/billing/routes";

logger.info("🚀 Starting Elysia server...");

// Elysia plugin to capture raw body for Stripe webhooks
function rawBodyCapturePlugin() {
  return (app: any) => {
    app.onRequest(async (ctx: any) => {
      if (
        ctx.request.method === "POST" &&
        ctx.request.url.endsWith("/webhooks/stripe/billing")
      ) {
        const reader = ctx.request.body?.getReader?.();
        if (reader) {
          let rawBody = Buffer.alloc(0);
          let done, value;
          while (true) {
            ({ done, value } = await reader.read());
            if (done) break;
            if (value) {
              rawBody = Buffer.concat([rawBody, Buffer.from(value)]);
            }
          }
          ctx.rawBody = rawBody;
        }
      }
    });
    return app;
  };
}

const app = new Elysia()
  .use(rawBodyCapturePlugin())
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

  // Context decorators (add early for webhook access)
  .decorate("db", db)

  // Webhook routes (NO AUTH) - MUST be before middleware that consumes body
  .post(
    "/webhooks/stripe/billing",
    async (ctx) => {
      const { logger } = await import("./lib/logger");
      try {
        // Use the captured raw body
        const rawBody = ctx.rawBody;
        const signature = ctx.headers["stripe-signature"];
        if (!signature) {
          logger.error(
            { operation: "stripe_webhook", error: "Missing Stripe signature" },
            "Missing Stripe signature header"
          );
          ctx.set.status = 200;
          return { received: false, error: "Missing Stripe signature" };
        }

        logger.info(
          { operation: "stripe_webhook", payload: rawBody },
          "Received Stripe webhook payload"
        );

        // Import services inline to avoid circular dependencies
        const { StripeService } = await import(
          "./modules/billing/stripe-service"
        );
        const { SubscriptionService } = await import(
          "./modules/billing/subscription-service"
        );

        // Verify webhook signature and normalize event format
        let normalizedEvent;
        try {
          normalizedEvent = await StripeService.verifyWebhookSignature(
            rawBody,
            signature
          );
        } catch (err) {
          logger.error(
            { operation: "stripe_webhook", error: err },
            "Signature verification or event parsing failed"
          );
          ctx.set.status = 200;
          return { received: false, error: "Signature verification failed" };
        }

        logger.info(
          {
            operation: "stripe_webhook",
            eventType: normalizedEvent.type,
            eventId: normalizedEvent.id,
            format: normalizedEvent.format,
          },
          `Processing Stripe webhook: ${normalizedEvent.type} (${normalizedEvent.format})`
        );

        // Handle only supported event types
        if (
          normalizedEvent.type &&
          normalizedEvent.type.includes("subscription")
        ) {
          let subscription;
          if (
            normalizedEvent.format === "thin" &&
            normalizedEvent.related_object
          ) {
            subscription = await StripeService.fetchRelatedObject(
              normalizedEvent.related_object
            );
          } else if (normalizedEvent.data?.object) {
            subscription = normalizedEvent.data.object;
          }

          if (subscription) {
            const customerId = subscription.customer;
            const subscriptionId = subscription.id;
            const status = subscription.status;

            // Find user by Stripe customer ID
            const user = ctx.db
              .prepare("SELECT id FROM users WHERE stripe_customer_id = ?")
              .get(customerId) as { id: number } | undefined;

            if (user) {
              if (
                status === "canceled" ||
                normalizedEvent.type.includes("deleted")
              ) {
                await SubscriptionService.cancelSubscription(
                  user.id,
                  subscriptionId
                );
                logger.info(
                  {
                    operation: "stripe_webhook_processed",
                    eventType: normalizedEvent.type,
                    userId: user.id,
                    subscriptionId,
                  },
                  "Canceled subscription from webhook"
                );
              } else {
                const currentPeriodEnd = new Date(
                  subscription.current_period_end * 1000
                ).toISOString();
                await SubscriptionService.upsertSubscription(
                  user.id,
                  subscriptionId,
                  status,
                  currentPeriodEnd
                );
                logger.info(
                  {
                    operation: "stripe_webhook_processed",
                    eventType: normalizedEvent.type,
                    userId: user.id,
                    subscriptionId,
                    status,
                  },
                  "Updated subscription from webhook"
                );
              }
            } else {
              logger.warn(
                {
                  operation: "stripe_webhook",
                  eventType: normalizedEvent.type,
                  customerId,
                  subscriptionId,
                },
                "User not found for Stripe customer ID"
              );
            }
          }
        } else {
          // Log and gracefully handle unsupported event types
          logger.info(
            { operation: "stripe_webhook", eventType: normalizedEvent?.type },
            `Received unsupported or unhandled event type: ${normalizedEvent?.type}`
          );
        }

        ctx.set.status = 200;
        return {
          received: true,
          format: normalizedEvent.format,
          eventType: normalizedEvent.type,
        };
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error : new Error(String(error)),
            operation: "stripe_webhook",
          },
          "Failed to process webhook"
        );
        ctx.set.status = 200;
        return { received: false, error: "Webhook processing failed" };
      }
    },
    {
      // Accept any body type to prevent 422 errors from Elysia validation
      body: t.Any(),
      detail: {
        summary: "Handle Stripe webhooks (NO AUTH)",
        tags: ["Billing"],
      },
    }
  )

  // Apply middleware after webhook routes to avoid body consumption conflicts
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

  // Public auth routes (no authentication required)
  .use(authRoutes)

  // Apply auth middleware globally (it has path exemptions built-in)
  .use(authMiddleware)

  // All other routes
  .use(userRoutes)
  .use(macroRoutes)
  .use(goalRoutes)
  .use(habitRoutes)
  .use(billingRoutes)

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

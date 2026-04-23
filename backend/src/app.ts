import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import type { Database } from "bun:sqlite";
import { config } from "./config";
import { clerkAuthMiddleware } from "./middleware/clerk-auth";
import { localAuthMiddleware } from "./middleware/local-auth";
import { rateLimiters } from "./middleware/rate-limit";
import { requestLimitsMiddleware } from "./middleware/request-limits";
import {
  correlationMiddleware,
  enhancedApiLogging,
} from "./middleware/correlation";
import { handleError } from "./lib/http/responses";
import { isAppError } from "./lib/http/errors";
import { logger } from "./lib/observability/logger";

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
import { recordRequest } from "./lib/observability/metrics";

function isClerkAuthMode(): boolean {
  return config.AUTH_MODE === "clerk";
}

function isManagedBillingMode(): boolean {
  return config.BILLING_MODE === "managed";
}

interface TimingContext {
  requestStartTime?: number;
  request: Request;
  set?: {
    status?: number;
    headers?: Record<string, string>;
  };
}

type MutableResponseSet = {
  status?: unknown;
  headers?: unknown;
};

type ErrorResponsePayload = {
  code: string;
  message: string;
  details?: string;
};

type ErrorHandlerContext = {
  code: unknown;
  error: unknown;
  set: MutableResponseSet;
  path?: unknown;
};

const ELYSIA_STATUS_MAP: Readonly<Record<string, number>> = {
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  CONFLICT: 409,
  NOT_IMPLEMENTED: 501,
  INTERNAL_SERVER_ERROR: 500,
};

function markRequestStart(context: unknown): void {
  (context as TimingContext).requestStartTime = Date.now();
}

function getRequestStartTime(context: TimingContext): number {
  return typeof context.requestStartTime === "number"
    ? context.requestStartTime
    : Date.now();
}

function resolveStatusCode(status: unknown): number {
  return typeof status === "number" ? status : 200;
}

function recordRequestTiming(context: unknown): void {
  const typedContext = context as TimingContext;
  const { request, set } = typedContext;
  const start = getRequestStartTime(typedContext);
  const duration = Date.now() - start;
  const path = new URL(request.url).pathname;
  const statusCode = resolveStatusCode(set?.status);

  recordRequest(request.method, path, statusCode, duration);
}

function configureSwaggerDocs(app: Elysia): void {
  if (config.NODE_ENV === "production") {
    return;
  }

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
  app.get("/api/api/docs/json", ({ set }) => {
    set.status = 302;
    set.headers = {};
    set.headers["Location"] = "/api/docs/json";
    return;
  });
}

function getHeadersRecord(set: MutableResponseSet): Record<string, string> {
  if (set.headers && typeof set.headers === "object") {
    return set.headers as Record<string, string>;
  }

  const headers: Record<string, string> = {};
  set.headers = headers;
  return headers;
}

function ensureApiJsonContentType(path: unknown, set: MutableResponseSet): void {
  if (typeof path !== "string" || !path.startsWith("/api/")) {
    return;
  }

  const headers = getHeadersRecord(set);
  headers["Content-Type"] = "application/json";
}

function normalizeErrorCode(code: unknown): string {
  if (typeof code === "string") {
    return code;
  }

  if (typeof code === "number") {
    return String(code);
  }

  return "INTERNAL_ERROR";
}

function mapElysiaCodeToStatus(code: string): number {
  return ELYSIA_STATUS_MAP[code] ?? 500;
}

function buildValidationErrorPayload(error: unknown): ErrorResponsePayload {
  return {
    code: "VALIDATION_ERROR",
    message: "Input validation failed",
    details: error instanceof Error ? error.message : String(error),
  };
}

function buildUnexpectedErrorPayload(
  code: string,
  error: unknown,
  statusCode: number
): ErrorResponsePayload {
  const base: ErrorResponsePayload = {
    code: code || "INTERNAL_ERROR",
    message:
      error instanceof Error ? error.message : "An unexpected error occurred",
  };

  if (
    config.NODE_ENV !== "production" &&
    statusCode >= 500 &&
    error instanceof Error
  ) {
    base.details = error.stack;
  }

  return base;
}

function maybeLogServerStack(statusCode: number, error: unknown): void {
  if (statusCode >= 500 && error instanceof Error) {
    logger.error({ error, stack: error.stack }, "Server error stack trace");
  }
}

function handleGlobalError({ code, error, set, path }: ErrorHandlerContext) {
  const errorCode = normalizeErrorCode(code);

  logger.error(
    {
      type: "elysia_error",
      code: errorCode,
      error: error instanceof Error ? error : new Error(String(error)),
    },
    `[${errorCode}] ${error?.toString() ?? "Unknown error"}`
  );

  ensureApiJsonContentType(path, set);

  if (isAppError(error)) {
    const responseSet = {
      status: typeof set.status === "number" ? set.status : undefined,
      headers: getHeadersRecord(set),
    };

    const response = handleError(error, responseSet);
    set.status = responseSet.status;
    set.headers = responseSet.headers;
    return response;
  }

  if (errorCode === "VALIDATION") {
    set.status = 400;
    return buildValidationErrorPayload(error);
  }

  const statusCode = mapElysiaCodeToStatus(errorCode);
  set.status = statusCode;
  maybeLogServerStack(statusCode, error);

  return buildUnexpectedErrorPayload(errorCode, error, statusCode);
}

function registerCoreRoutes(app: Elysia, db: Database): void {
  const withClerk = isClerkAuthMode();
  const withManagedBilling = isManagedBillingMode();

  const core = app
    // Context decorators (add early for webhook access)
    .decorate("db", db);

  if (withManagedBilling) {
    // Webhook routes (NO AUTH) - MUST be before middleware that consumes body
    core.use(webhookHandler);
  }

  if (withClerk) {
    // Clerk webhook handler (NO AUTH) - handles user sync from Clerk
    core.use(clerkWebhookHandler);
  }

  core

    // Apply middleware after webhook routes to avoid body consumption conflicts
    .use(correlationMiddleware)
    .use(enhancedApiLogging)

    // Apply rate limiting
    .use(rateLimiters.api);

  if (withClerk) {
    // Apply Clerk auth middleware globally (it has path exemptions built-in)
    // This must run before routes that depend on Clerk user context (e.g. /api/auth/clerk-sync)
    core.use(clerkAuthMiddleware);
  } else {
    // In local mode, use DB-backed sessions for protected routes.
    core.use(localAuthMiddleware);
  }

  core
    // Public auth routes
    .use(authRoutes)

    // All other routes
    .use(userRoutes)
    .use(macroRoutes)
    .use(goalRoutes)
    .use(habitRoutes)
    .use(reportingRoutes)
    .use(savedMealRoutes)

    // Health check routes (public, no auth)
    .use(healthRoutes)

    // Metrics endpoint (public, no auth) - Prometheus-compatible
    .use(metricsRoutes);

  if (withManagedBilling) {
    core.use(billingRoutes);
  }
}

export function createApp(db: Database) {
  const app = new Elysia()
    // Request size limits for security
    .use(requestLimitsMiddleware)

    // Request timing middleware for metrics collection
    .onRequest(markRequestStart)

    .onAfterResponse(recordRequestTiming)

    // Global middleware & plugins
    .use(
      cors({
        origin: config.CORS_ORIGIN,
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      })
    );

  configureSwaggerDocs(app);
  registerCoreRoutes(app, db);

  app.onError(({ code, error, set, path }) =>
    handleGlobalError({ code, error, set, path })
  );

  return app;
}

// src/middleware/correlation.ts
import { Elysia } from "elysia";
import { v4 as uuidv4 } from "uuid";
import { loggerHelpers } from "../lib/logger";

function getOptionalStringProperty(
  source: unknown,
  key: string,
): string | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const candidate = source as Record<string, unknown>;
  const value = candidate[key];
  return typeof value === "string" ? value : undefined;
}

function getOptionalNumberProperty(
  source: unknown,
  key: string,
): number | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const candidate = source as Record<string, unknown>;
  const value = candidate[key];
  return typeof value === "number" ? value : undefined;
}

function getOptionalUserId(source: unknown): number | undefined {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  const candidate = source as Record<string, unknown>;
  const user = candidate.user;
  if (!user || typeof user !== "object") {
    return undefined;
  }

  const userRecord = user as Record<string, unknown>;
  return typeof userRecord.userId === "number" ? userRecord.userId : undefined;
}

/**
 * Middleware to add correlation IDs to requests for distributed tracing
 * Correlation IDs help track requests across multiple services and logs
 */
export const correlationMiddleware = new Elysia({ name: "correlation" })
  .derive({ as: "scoped" }, ({ request }) => {
    // Extract existing correlation ID from headers or generate new one
    const correlationId =
      request.headers.get("x-correlation-id") ||
      request.headers.get("x-request-id") ||
      uuidv4();

    return { correlationId };
  })
  .onRequest((context) => {
    const { request } = context;
    const correlationId = getOptionalStringProperty(context, "correlationId") || "unknown";

    // Log the start of request processing
    loggerHelpers.apiRequest(
      request.method,
      new URL(request.url).pathname,
      undefined, // userId not available yet
      { correlationId }
    );
  })
  .onAfterHandle({ as: "scoped" }, ({ correlationId, set }) => {
    // Add correlation ID to response headers for client tracking
    set.headers["x-correlation-id"] = correlationId;
    set.headers["x-request-id"] = correlationId;
  })
  .onError({ as: "scoped" }, ({ correlationId, error, code, request }) => {
    // Log errors with correlation ID for easier debugging
    loggerHelpers.error(
      error instanceof Error ? error : new Error(String(error)),
      {
        correlationId,
        code,
        method: request.method,
        path: new URL(request.url).pathname,
      }
    );
  });

/**
 * Enhanced API response logging with correlation ID and timing
 */
export const enhancedApiLogging = new Elysia({ name: "apiLogging" })
  .use(correlationMiddleware)
  .derive({ as: "scoped" }, () => {
    return { startTime: Date.now() };
  })
  .onAfterHandle({ as: "scoped" }, (context) => {
    const { set, request } = context;
    const correlationId = getOptionalStringProperty(context, "correlationId") || "unknown";
    const startTime = getOptionalNumberProperty(context, "startTime") ?? Date.now();
    const userId = getOptionalUserId(context);

    const duration = Date.now() - (startTime || Date.now());
    const statusCode = typeof set.status === "number" ? set.status : 200;
    const path = new URL(request.url).pathname;

    // Log API response with timing and correlation info
    loggerHelpers.apiResponse(
      request.method,
      path,
      statusCode,
      duration,
      userId
    );

    // Log performance warnings for slow requests
    const SLOW_REQUEST_THRESHOLD_MS = 1000;
    if (duration > SLOW_REQUEST_THRESHOLD_MS) {
      loggerHelpers.performance(
        `Slow API request: ${request.method} ${path}`,
        duration,
        { correlationId, userId }
      );
    }

    // Add performance headers
    set.headers["x-response-time"] = `${duration}ms`;
  });

// src/middleware/correlation.ts
import { Elysia } from "elysia";
import { v4 as uuidv4 } from "uuid";
import { loggerHelpers } from "../lib/logger";

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
  .onRequest((context: any) => {
    const { correlationId, request } = context;

    // Add correlation ID to request for downstream processing
    (request as any).correlationId = correlationId;

    // Log the start of request processing
    loggerHelpers.apiRequest(
      request.method,
      new URL(request.url).pathname,
      undefined, // userId not available yet
      { correlationId }
    );
  })
  .onAfterHandle({ as: "scoped" }, (context: any) => {
    const { correlationId, set } = context;

    // Add correlation ID to response headers for client tracking
    set.headers["x-correlation-id"] = correlationId;
    set.headers["x-request-id"] = correlationId;
  })
  .onError({ as: "scoped" }, (context: any) => {
    const { correlationId, error, code, request } = context;

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
  .derive({ as: "scoped" }, () => {
    return { startTime: Date.now() };
  })
  .onAfterHandle({ as: "scoped" }, (context: any) => {
    const { correlationId, startTime, set, request, user } = context;
    const duration = Date.now() - (startTime || Date.now());
    const statusCode = typeof set.status === "number" ? set.status : 200;
    const path = new URL(request.url).pathname;

    // Log API response with timing and correlation info
    loggerHelpers.apiResponse(
      request.method,
      path,
      statusCode,
      duration,
      user?.userId
    );

    // Log performance warnings for slow requests
    if (duration > 1000) {
      loggerHelpers.performance(
        `Slow API request: ${request.method} ${path}`,
        duration,
        { correlationId, userId: user?.userId }
      );
    }

    // Add performance headers
    set.headers["x-response-time"] = `${duration}ms`;
  });

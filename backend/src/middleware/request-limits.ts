// src/middleware/request-limits.ts
import { Elysia } from "elysia";

const MAX_BODY_SIZE = 1024 * 1024; // 1MB limit

/**
 * Middleware to enforce request body size limits for security.
 * Returns 413 Payload Too Large if content-length exceeds limit.
 */
export const requestLimitsMiddleware = new Elysia({ name: "request-limits" })
  .onRequest(({ request, set }) => {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
      set.status = 413;
      return {
        code: "PAYLOAD_TOO_LARGE",
        message: `Request body too large. Maximum size is ${MAX_BODY_SIZE / 1024 / 1024}MB.`,
      };
    }
  });

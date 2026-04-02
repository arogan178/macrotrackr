// src/middleware/rate-limit.ts
import { Elysia } from "elysia";
import { loggerHelpers } from "../lib/logger";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  keyGenerator?: (request: Request) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (use Redis in production for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

let cleanupIntervalId: ReturnType<typeof setInterval> | null = null;

function startCleanupInterval() {
  if (cleanupIntervalId) {
    return;
  }

  cleanupIntervalId = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 60000); // Clean up every minute
}

export function stopRateLimitCleanupForTests() {
  if (!cleanupIntervalId) {
    return;
  }

  clearInterval(cleanupIntervalId);
  cleanupIntervalId = null;
}

export const rateLimit = (config: RateLimitConfig) => {
  startCleanupInterval();

  const {
    windowMs,
    maxRequests,
    message = "Too many requests, please try again later",
    keyGenerator = (request: Request) => {
      // Default: use IP address
      const headers = request.headers;
      return (
        headers.get("x-forwarded-for") ||
        headers.get("x-real-ip") ||
        "unknown"
      );
    },
  } = config;

  return new Elysia().onRequest(({ request, set }) => {
    const key = keyGenerator(request);
    const now = Date.now();

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    } else {
      // Increment count for existing entry
      entry.count++;
    }

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      loggerHelpers.security(
        "rate_limit_exceeded",
        {
          key,
          count: entry.count,
          maxRequests,
          windowMs,
          resetTime: entry.resetTime,
        },
        "medium"
      );

      set.status = 429;
      set.headers["Retry-After"] = Math.ceil(
        (entry.resetTime - now) / 1000
      ).toString();
      set.headers["X-RateLimit-Limit"] = maxRequests.toString();
      set.headers["X-RateLimit-Remaining"] = "0";
      set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();

      return {
        code: "RATE_LIMIT_EXCEEDED",
        message,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000),
      };
    }

    // Add rate limit headers
    set.headers["X-RateLimit-Limit"] = maxRequests.toString();
    set.headers["X-RateLimit-Remaining"] = (
      maxRequests - entry.count
    ).toString();
    set.headers["X-RateLimit-Reset"] = entry.resetTime.toString();
  });
};

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 500, // 50 attempts per 15 minutes
    message: "Too many authentication attempts, please try again in 15 minutes",
  }),

  // Moderate rate limiting for API endpoints
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    message: "Too many API requests, please try again later",
  }),

  // Lenient rate limiting for read operations
  read: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    maxRequests: 600, // 60 requests per minute
    message: "Too many requests, please slow down",
  }),
};

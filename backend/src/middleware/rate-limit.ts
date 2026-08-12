// src/middleware/rate-limit.ts
import { Elysia } from "elysia";
import { config } from "../config";
import { loggerHelpers } from "../lib/observability/logger";

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  /** Namespace so separate limiters never share a bucket for the same client. */
  scope: string;
  /** Only apply the limiter when this returns true. */
  appliesTo?: (request: Request) => boolean;
  keyGenerator?: (request: Request, server: RequestIpResolver | null) => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RequestIpResolver {
  requestIP?: (request: Request) => { address?: string } | null;
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

/**
 * Resolve the client identity to rate limit on.
 *
 * X-Forwarded-For is attacker-controlled unless a reverse proxy overwrites it,
 * so it is only consulted when TRUST_PROXY is enabled. Otherwise we fall back
 * to the socket address, which a client cannot forge.
 */
export function resolveClientIdentifier(
  request: Request,
  server: RequestIpResolver | null,
): string {
  if (config.TRUST_PROXY) {
    // X-Real-IP is preferred: our nginx sets it to $remote_addr, overwriting
    // anything the client sent. X-Forwarded-For is *appended* to, so its
    // leftmost entry is still whatever the client claimed.
    const realIp = request.headers.get("x-real-ip")?.trim();
    if (realIp) {
      return realIp;
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim();
    if (clientIp) {
      return clientIp;
    }
  }

  const socketAddress = server?.requestIP?.(request)?.address;
  return socketAddress ?? "unknown";
}

export const rateLimit = (limitConfig: RateLimitConfig) => {
  startCleanupInterval();

  const {
    windowMs,
    maxRequests,
    scope,
    appliesTo,
    message = "Too many requests, please try again later",
    keyGenerator = resolveClientIdentifier,
  } = limitConfig;

  return new Elysia().onRequest((context) => {
    const { request, set } = context;

    if (appliesTo && !appliesTo(request)) {
      return;
    }

    const server = (context as { server?: RequestIpResolver | null }).server ?? null;
    const key = `${scope}:${keyGenerator(request, server)}`;
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

/** Credential endpoints worth protecting against online brute force. */
const SENSITIVE_AUTH_PATHS = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/change-password",
]);

export function isSensitiveAuthRequest(request: Request): boolean {
  if (request.method !== "POST") {
    return false;
  }

  try {
    return SENSITIVE_AUTH_PATHS.has(new URL(request.url).pathname);
  } catch {
    return false;
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Moderate rate limiting for API endpoints
  api: rateLimit({
    scope: "api",
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000, // 1000 requests per 15 minutes
    message: "Too many API requests, please try again later",
  }),

  // Strict limit for credential endpoints to blunt password guessing
  auth: rateLimit({
    scope: "auth",
    windowMs: 15 * 60 * 1000,
    maxRequests: 20,
    appliesTo: isSensitiveAuthRequest,
    message: "Too many authentication attempts, please try again later",
  }),
};

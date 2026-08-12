// src/middleware/security-headers.ts
import { Elysia } from "elysia";
import { config } from "../config";

const ONE_YEAR_SECONDS = 31536000;

/**
 * Baseline response hardening for every API response.
 *
 * The API only ever returns JSON, so it can use a maximally restrictive CSP
 * and framing policy — nothing here is meant to be embedded or rendered.
 */
export function getSecurityHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Cross-Origin-Resource-Policy": "same-site",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
  };

  if (config.NODE_ENV === "production") {
    headers["Strict-Transport-Security"] =
      `max-age=${ONE_YEAR_SECONDS}; includeSubDomains`;
  }

  return headers;
}

function isDocsPath(request: Request): boolean {
  try {
    const { pathname } = new URL(request.url);
    return pathname.startsWith("/api/docs") || pathname.startsWith("/api/api/docs");
  } catch {
    return false;
  }
}

export const securityHeadersMiddleware = new Elysia({ name: "security-headers" })
  .onRequest(({ request, set }) => {
    const headers = getSecurityHeaders();

    // Swagger UI (development only) needs to load its own scripts and styles.
    if (isDocsPath(request)) {
      delete headers["Content-Security-Policy"];
      delete headers["Cross-Origin-Resource-Policy"];
    }

    Object.assign(set.headers, headers);
  });

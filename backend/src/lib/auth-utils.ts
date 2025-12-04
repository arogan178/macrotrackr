// src/lib/auth-utils.ts
import { config } from "../config";

/**
 * Parse JWT expiration string (e.g., "30d", "1h", "60m") to seconds
 */
export function parseJwtExpToSeconds(jwtExp: string): number {
  const match = /^([0-9]+)([smhd])$/.exec(jwtExp);
  if (!match) return 60 * 60 * 24 * 30; // default 30 days

  const value = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value;
    case "m":
      return value * 60;
    case "h":
      return value * 60 * 60;
    case "d":
    default:
      return value * 60 * 60 * 24;
  }
}

/**
 * Get JWT cookie configuration for setting auth cookies
 */
export function getJwtCookieConfig(): {
  maxAge: number;
  flags: string;
  cookieString: (token: string) => string;
} {
  const isProduction = config.NODE_ENV === "production";
  const maxAge = parseJwtExpToSeconds(config.JWT_EXP);

  const flags = [
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    isProduction ? "Secure" : undefined,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    maxAge,
    flags,
    cookieString: (token: string) => `jwt=${token}; ${flags}`,
  };
}

/**
 * Generate a Set-Cookie header value for JWT token
 */
export function createJwtCookie(token: string): string {
  return getJwtCookieConfig().cookieString(token);
}

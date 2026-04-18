import { describe, expect, it, vi, beforeEach } from "vitest";

describe("auth-utils", () => {
  // Stub env before importing anything
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_test");
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "pk_test");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
    vi.stubEnv("NODE_ENV", "test");
  });

  describe("parseJwtExpToSeconds", () => {
    it("parses seconds", async () => {
      const { parseJwtExpToSeconds } = await import("../../src/lib/auth/auth-utils");
      
      expect(parseJwtExpToSeconds("60s")).toBe(60);
      expect(parseJwtExpToSeconds("30s")).toBe(30);
    });

    it("parses minutes", async () => {
      const { parseJwtExpToSeconds } = await import("../../src/lib/auth/auth-utils");
      
      expect(parseJwtExpToSeconds("30m")).toBe(1800);
      expect(parseJwtExpToSeconds("1m")).toBe(60);
    });

    it("parses hours", async () => {
      const { parseJwtExpToSeconds } = await import("../../src/lib/auth/auth-utils");
      
      expect(parseJwtExpToSeconds("2h")).toBe(7200);
      expect(parseJwtExpToSeconds("1h")).toBe(3600);
    });

    it("parses days", async () => {
      const { parseJwtExpToSeconds } = await import("../../src/lib/auth/auth-utils");
      
      expect(parseJwtExpToSeconds("7d")).toBe(604800);
      expect(parseJwtExpToSeconds("30d")).toBe(2592000);
    });

    it("returns default for invalid format", async () => {
      const { parseJwtExpToSeconds } = await import("../../src/lib/auth/auth-utils");
      
      expect(parseJwtExpToSeconds("invalid")).toBe(2592000); // default 30 days
    });
  });

  describe("getJwtCookieConfig", () => {
    it("returns cookie config with max age", async () => {
      const { getJwtCookieConfig } = await import("../../src/lib/auth/auth-utils");
      
      const config = getJwtCookieConfig();
      
      expect(config.maxAge).toBeGreaterThan(0);
      expect(config.flags).toContain("Path=/");
      expect(config.flags).toContain("HttpOnly");
    });

    it("excludes Secure flag in non-production", async () => {
      vi.stubEnv("NODE_ENV", "development");
      
      const { getJwtCookieConfig } = await import("../../src/lib/auth/auth-utils");
      
      const config = getJwtCookieConfig();
      
      expect(config.flags).not.toContain("Secure");
    });
  });

  describe("createJwtCookie", () => {
    it("creates cookie string with token", async () => {
      const { createJwtCookie } = await import("../../src/lib/auth/auth-utils");
      
      const cookie = createJwtCookie("my-token");
      
      expect(cookie).toContain("jwt=my-token");
      expect(cookie).toContain("Path=/");
    });
  });
});

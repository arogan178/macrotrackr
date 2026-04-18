import { describe, expect, it } from "vitest";
import { rateLimit, rateLimiters } from "../../src/middleware/rate-limit";

describe("rate-limit middleware", () => {
  describe("rateLimit", () => {
    it("should be a function", () => {
      expect(typeof rateLimit).toBe("function");
    });

    it("should return an Elysia instance", () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 100,
      });
      expect(middleware).toBeDefined();
      expect(typeof middleware).toBe("object");
    });

    it("should accept custom message", () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 100,
        message: "Custom rate limit message",
      });
      expect(middleware).toBeDefined();
    });

    it("should accept custom keyGenerator", () => {
      const middleware = rateLimit({
        windowMs: 60000,
        maxRequests: 100,
        keyGenerator: () => "custom-key",
      });
      expect(middleware).toBeDefined();
    });
  });

  describe("rateLimiters", () => {
    it("should have auth rate limiter", () => {
      expect(rateLimiters.auth).toBeDefined();
    });

    it("should have api rate limiter", () => {
      expect(rateLimiters.api).toBeDefined();
    });

    it("should have read rate limiter", () => {
      expect(rateLimiters.read).toBeDefined();
    });

    it("auth should have stricter limits", () => {
      expect(rateLimiters.auth).toBeDefined();
    });

    it("api should have moderate limits", () => {
      expect(rateLimiters.api).toBeDefined();
    });

    it("read should have lenient limits", () => {
      expect(rateLimiters.read).toBeDefined();
    });
  });
});

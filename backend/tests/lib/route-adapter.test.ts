import { describe, expect, it, vi, beforeEach } from "vitest";

describe("route-adapter", () => {
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
  });

  describe("resolveAuthenticatedUser", () => {
    it("resolves user with valid clerk user ID", async () => {
      const { resolveAuthenticatedUser } = await import("../../src/lib/route-adapter");
      
      const context = {
        user: {
          clerkUserId: "user_123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe"
        },
        internalUserId: 42
      };
      
      const result = resolveAuthenticatedUser(context as any);
      
      expect(result.userId).toBe(42);
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
    });

    it("throws AuthenticationError when clerkUserId is missing", async () => {
      const { resolveAuthenticatedUser } = await import("../../src/lib/route-adapter");
      
      const context = {
        user: {},
        internalUserId: 42
      };
      
      expect(() => resolveAuthenticatedUser(context as any)).toThrow();
    });

    it("throws NotFoundError when internalUserId is missing and no db", async () => {
      const { resolveAuthenticatedUser } = await import("../../src/lib/route-adapter");
      
      const context = {
        user: { clerkUserId: "user_123" }
      };
      
      expect(() => resolveAuthenticatedUser(context as any)).toThrow();
    });
  });
});

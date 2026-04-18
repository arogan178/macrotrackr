import { describe, expect, it, vi, beforeEach } from "vitest";

describe("route-adapter", () => {
  // Stub env before importing anything
  beforeEach(() => {
    vi.stubEnv("JWT_SECRET", "test-secret-that-is-at-least-32-chars");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "test_webhook_secret_marker");
    vi.stubEnv("STRIPE_PRICE_ID_MONTHLY", "price_monthly");
    vi.stubEnv("STRIPE_PRICE_ID_YEARLY", "price_yearly");
    vi.stubEnv("RESEND_API_KEY", "test_resend_api_key_marker");
    vi.stubEnv("CLERK_PUBLISHABLE_KEY", "pk_test");
    vi.stubEnv("CLERK_SECRET_KEY", "sk_test");
  });

  describe("resolveClerkIdentity", () => {
    it("resolves user with valid clerk user ID", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: {
          clerkUserId: "user_123",
          email: "test@example.com",
          firstName: "John",
          lastName: "Doe"
        },
        internalUserId: 42,
        clerkUserId: "user_123",
      };
      
      const result = resolveClerkIdentity(context as any);
      
      expect(result.clerkUserId).toBe("user_123");
      expect(result.email).toBe("test@example.com");
      expect(result.firstName).toBe("John");
    });

    it("throws AuthenticationError when clerkUserId is missing", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: {},
        internalUserId: 42
      };
      
      expect(() => resolveClerkIdentity(context as any)).toThrow();
    });

    it("accepts missing internalUserId because identity is Clerk-based", async () => {
      const { resolveClerkIdentity } = await import("../../src/lib/auth/route-adapter");
      
      const context = {
        user: { clerkUserId: "user_123" }
      };
      
      const result = resolveClerkIdentity(context as any);
      expect(result.clerkUserId).toBe("user_123");
    });
  });
});

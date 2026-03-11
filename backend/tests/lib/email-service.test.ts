import { describe, expect, it, vi, beforeEach } from "vitest";

describe("email-service", () => {
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

  describe("emailService", () => {
    it("exports sendPasswordResetEmail function", async () => {
      const { emailService } = await import("../../src/lib/email-service");
      
      expect(emailService).toBeDefined();
      expect(typeof emailService.sendPasswordResetEmail).toBe("function");
    });
  });
});

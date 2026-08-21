import { beforeEach, describe, expect, it, vi } from "vitest";

const hasActiveProSubscriptionMock = vi.fn();
let appMode: "managed" | "self-hosted" = "managed";

vi.mock("../../src/modules/billing/subscription-service", () => ({
  SubscriptionService: {
    hasActiveProSubscription: (...arguments_: unknown[]) =>
      hasActiveProSubscriptionMock(...arguments_),
  },
}));

import { resetConfigCache } from "../../src/config";
import {
  requireAuth,
  FREE_TIER_LIMITS,
  checkFeatureLimit,
  checkProStatus,
} from "../../src/middleware/clerk-guards";

describe("clerk-guards", () => {
  beforeEach(() => {
    hasActiveProSubscriptionMock.mockReset();
    appMode = "managed";
    process.env.APP_MODE = "managed";
    process.env.AUTH_MODE = "clerk";
    process.env.BILLING_MODE = "managed";
    process.env.CLERK_PUBLISHABLE_KEY = "pk_test_123";
    process.env.CLERK_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_SECRET_KEY = "sk_test_123";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_123";
    process.env.STRIPE_PRICE_ID_MONTHLY = "price_monthly_123";
    process.env.STRIPE_PRICE_ID_YEARLY = "price_yearly_123";
    resetConfigCache();
  });

  describe("FREE_TIER_LIMITS", () => {
    it("should have MAX_HABITS defined as 5", () => {
      expect(FREE_TIER_LIMITS.MAX_HABITS).toBe(5);
    });

    it("should have FREE_VISIBLE_HISTORY_DAYS defined as 7", () => {
      expect(FREE_TIER_LIMITS.FREE_VISIBLE_HISTORY_DAYS).toBe(7);
    });

    it("should have MAX_SAVED_MEALS defined as 5", () => {
      expect(FREE_TIER_LIMITS.MAX_SAVED_MEALS).toBe(5);
    });
  });

  describe("requireAuth", () => {
    it("should be defined", () => {
      expect(requireAuth).toBeDefined();
    });

    it("should be an Elysia instance", () => {
      expect(requireAuth).toBeDefined();
      expect(typeof requireAuth).toBe("object");
    });
  });

  describe("checkProStatus", () => {
    it("should be a function", () => {
      expect(typeof checkProStatus).toBe("function");
    });

    it("should return a promise", () => {
      hasActiveProSubscriptionMock.mockResolvedValue(true);

      const result = checkProStatus(1);
      expect(result).toBeInstanceOf(Promise);
    });

    it("returns true in self-hosted mode", async () => {
      appMode = "self-hosted";
      process.env.APP_MODE = "self-hosted";
      process.env.AUTH_MODE = "local";
      process.env.BILLING_MODE = "disabled";
      resetConfigCache();

      await expect(checkProStatus(1)).resolves.toBe(true);
      expect(hasActiveProSubscriptionMock).not.toHaveBeenCalled();
    });
  });

  describe("checkFeatureLimit", () => {
    it("should be a function", () => {
      expect(typeof checkFeatureLimit).toBe("function");
    });

    it("should return a promise", () => {
      const result = checkFeatureLimit(1, "MAX_HABITS", 2);
      expect(result).toBeInstanceOf(Promise);
    });

    it("should return allowed true when under limit", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(false);

      const result = await checkFeatureLimit(1, "MAX_HABITS", 4);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(false);
      expect(result.limit).toBe(5);
    });

    it("should return allowed false when at limit", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(false);

      const result = await checkFeatureLimit(1, "MAX_HABITS", 5);
      expect(result.allowed).toBe(false);
      expect(result.isProUser).toBe(false);
      expect(result.limit).toBe(5);
      expect(result.message).toContain("habits");
    });

    it("should return allowed true for Pro users regardless of count", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(true);

      const result = await checkFeatureLimit(1, "MAX_HABITS", 100);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(true);
    });

    it("bypasses feature limits in self-hosted mode", async () => {
      appMode = "self-hosted";
      process.env.APP_MODE = "self-hosted";
      process.env.AUTH_MODE = "local";
      process.env.BILLING_MODE = "disabled";
      resetConfigCache();

      const result = await checkFeatureLimit(1, "MAX_HABITS", 999);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(true);
      expect(hasActiveProSubscriptionMock).not.toHaveBeenCalled();
    });
  });
});

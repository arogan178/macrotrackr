import { beforeEach, describe, expect, it, vi } from "vitest";

const hasActiveProSubscriptionMock = vi.fn();
let appMode: "managed" | "self-hosted" = "managed";

vi.mock("../../src/modules/billing/subscription-service", () => ({
  SubscriptionService: {
    hasActiveProSubscription: (...arguments_: unknown[]) =>
      hasActiveProSubscriptionMock(...arguments_),
  },
}));

vi.mock("../../src/config", () => ({
  config: new Proxy(
    {},
    {
      get: (_target, property) => {
        if (property === "APP_MODE") {
          return appMode;
        }

        if (property === "NODE_ENV") {
          return "test";
        }

        return undefined;
      },
    },
  ),
  getConfig: () => ({
    APP_MODE: appMode,
    NODE_ENV: "test",
  }),
}));

import {
  requireAuth,
  FREE_TIER_LIMITS,
  checkFeatureLimit,
  checkProStatus,
  type FeatureLimitKey,
} from "../../src/middleware/clerk-guards";

describe("clerk-guards", () => {
  beforeEach(() => {
    hasActiveProSubscriptionMock.mockReset();
    appMode = "managed";
  });

  describe("FREE_TIER_LIMITS", () => {
    it("should have MAX_GOALS defined as 3", () => {
      expect(FREE_TIER_LIMITS.MAX_GOALS).toBe(3);
    });

    it("should have MAX_HABITS defined as 5", () => {
      expect(FREE_TIER_LIMITS.MAX_HABITS).toBe(5);
    });

    it("should have MAX_MACRO_ENTRIES_PER_DAY defined as 20", () => {
      expect(FREE_TIER_LIMITS.MAX_MACRO_ENTRIES_PER_DAY).toBe(20);
    });

    it("should have MAX_WEIGHT_ENTRIES_PER_MONTH defined as 10", () => {
      expect(FREE_TIER_LIMITS.MAX_WEIGHT_ENTRIES_PER_MONTH).toBe(10);
    });

    it("should have DATA_RETENTION_DAYS defined as 60", () => {
      expect(FREE_TIER_LIMITS.DATA_RETENTION_DAYS).toBe(60);
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

      await expect(checkProStatus(1)).resolves.toBe(true);
      expect(hasActiveProSubscriptionMock).not.toHaveBeenCalled();
    });
  });

  describe("checkFeatureLimit", () => {
    it("should be a function", () => {
      expect(typeof checkFeatureLimit).toBe("function");
    });

    it("should return a promise", () => {
      const result = checkFeatureLimit(1, "MAX_GOALS" as FeatureLimitKey, 2);
      expect(result).toBeInstanceOf(Promise);
    });

    it("should return allowed true when under limit", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(false);

      const result = await checkFeatureLimit(1, "MAX_GOALS" as FeatureLimitKey, 2);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(false);
      expect(result.limit).toBe(3);
    });

    it("should return allowed false when at limit", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(false);

      const result = await checkFeatureLimit(1, "MAX_GOALS" as FeatureLimitKey, 3);
      expect(result.allowed).toBe(false);
      expect(result.isProUser).toBe(false);
      expect(result.limit).toBe(3);
      expect(result.message).toContain("goals");
    });

    it("should return allowed true for Pro users regardless of count", async () => {
      hasActiveProSubscriptionMock.mockResolvedValue(true);

      const result = await checkFeatureLimit(1, "MAX_GOALS" as FeatureLimitKey, 100);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(true);
    });

    it("bypasses feature limits in self-hosted mode", async () => {
      appMode = "self-hosted";

      const result = await checkFeatureLimit(1, "MAX_GOALS" as FeatureLimitKey, 999);
      expect(result.allowed).toBe(true);
      expect(result.isProUser).toBe(true);
      expect(hasActiveProSubscriptionMock).not.toHaveBeenCalled();
    });
  });
});

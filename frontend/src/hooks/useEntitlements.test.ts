import { resolveEntitlements } from "@shared/entitlements";
import { describe, expect, it } from "vitest";

describe("resolveEntitlements", () => {
  it("uses the server's five-habit limit for the free plan", () => {
    expect(
      resolveEntitlements({
        isSelfHosted: false,
        subscriptionStatus: "free",
      }),
    ).toEqual({
      hasProAccess: false,
      hasPaidPlan: false,
      habitLimit: 5,
    });
  });

  it("unlocks paid capabilities for active Pro and self-hosted users", () => {
    expect(
      resolveEntitlements({
        isSelfHosted: false,
        subscriptionStatus: "pro",
      }).habitLimit,
    ).toBeNull();
    expect(
      resolveEntitlements({
        isSelfHosted: true,
        subscriptionStatus: "free",
      }).hasProAccess,
    ).toBe(true);
  });

  it("keeps a canceled plan visible without granting expired access", () => {
    expect(
      resolveEntitlements({
        isSelfHosted: false,
        subscriptionStatus: "canceled",
      }),
    ).toMatchObject({
      hasProAccess: false,
      hasPaidPlan: true,
    });
  });
});

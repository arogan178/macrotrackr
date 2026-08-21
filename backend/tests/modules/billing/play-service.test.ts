import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { resetConfigCache } from "../../../src/config";
import { __testing } from "../../../src/modules/billing/play-service";

const { mapState, resolvePlan } = __testing;

const HOUR = 60 * 60 * 1000;
const future = () => new Date(Date.now() + 24 * HOUR).toISOString();
const past = () => new Date(Date.now() - 24 * HOUR).toISOString();

describe("mapState", () => {
  it("treats an active subscription as active", () => {
    expect(mapState("SUBSCRIPTION_STATE_ACTIVE", future())).toBe("active");
  });

  it("keeps access during a grace period, because Google still grants it", () => {
    expect(mapState("SUBSCRIPTION_STATE_IN_GRACE_PERIOD", future())).toBe(
      "active",
    );
  });

  it("keeps a canceled subscription active until the period actually ends", () => {
    // Play's CANCELED means auto-renew is off, not that access stopped.
    // Revoking here would cut paid users off early.
    expect(mapState("SUBSCRIPTION_STATE_CANCELED", future())).toBe("active");
  });

  it("drops a canceled subscription once the period has passed", () => {
    expect(mapState("SUBSCRIPTION_STATE_CANCELED", past())).toBe("canceled");
  });

  it("marks an on-hold subscription unpaid", () => {
    expect(mapState("SUBSCRIPTION_STATE_ON_HOLD", past())).toBe("unpaid");
  });

  it("marks a pending purchase unpaid, since it never granted access", () => {
    expect(mapState("SUBSCRIPTION_STATE_PENDING", future())).toBe("unpaid");
  });

  it("treats paused and expired as canceled", () => {
    expect(mapState("SUBSCRIPTION_STATE_PAUSED", future())).toBe("canceled");
    expect(mapState("SUBSCRIPTION_STATE_EXPIRED", past())).toBe("canceled");
  });

  it("fails closed on an unknown state", () => {
    expect(mapState("SUBSCRIPTION_STATE_UNSPECIFIED", future())).toBe("unpaid");
    expect(mapState(undefined, future())).toBe("unpaid");
  });

  it("does not grant access when there is no expiry to check", () => {
    expect(mapState("SUBSCRIPTION_STATE_CANCELED", null)).toBe("canceled");
  });
});

describe("resolvePlan", () => {
  beforeEach(() => {
    process.env.GOOGLE_PLAY_PRODUCT_ID_MONTHLY = "pro_monthly";
    process.env.GOOGLE_PLAY_PRODUCT_ID_YEARLY = "pro_yearly";
    resetConfigCache();
  });

  afterEach(() => {
    delete process.env.GOOGLE_PLAY_PRODUCT_ID_MONTHLY;
    delete process.env.GOOGLE_PLAY_PRODUCT_ID_YEARLY;
    resetConfigCache();
  });

  it("maps the configured product ids onto plans", () => {
    expect(resolvePlan("pro_monthly")).toBe("monthly");
    expect(resolvePlan("pro_yearly")).toBe("yearly");
  });

  it("returns unknown for anything else", () => {
    expect(resolvePlan("some_other_sku")).toBe("unknown");
    expect(resolvePlan(null)).toBe("unknown");
  });
});

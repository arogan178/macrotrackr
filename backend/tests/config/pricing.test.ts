import { describe, expect, it } from "vitest";

import {
  PLANS,
  getPlans,
} from "../../src/config/pricing";
import {
  FREE_PLAN_DEFINITION,
  PRICING,
  PRO_PLAN_DEFINITION,
} from "../../../shared/pricing";

describe("config/pricing", () => {
  it("derives backend plans from shared pricing definitions", () => {
    expect(PLANS).toEqual([
      {
        id: "free",
        name: FREE_PLAN_DEFINITION.name,
        description: FREE_PLAN_DEFINITION.description,
        price: 0,
        currency: "usd",
        interval: "month",
        features: FREE_PLAN_DEFINITION.features,
      },
      {
        id: "pro",
        name: PRO_PLAN_DEFINITION.name,
        description: PRO_PLAN_DEFINITION.description,
        price: PRICING.monthly,
        currency: "usd",
        interval: "month",
        features: PRO_PLAN_DEFINITION.features,
      },
    ]);
  });

  it("reuses shared feature lists to avoid contract drift", () => {
    expect(PLANS[0]?.features).toBe(FREE_PLAN_DEFINITION.features);
    expect(PLANS[1]?.features).toBe(PRO_PLAN_DEFINITION.features);
  });

  it("returns the canonical plan list", () => {
    expect(getPlans()).toBe(PLANS);
  });
});

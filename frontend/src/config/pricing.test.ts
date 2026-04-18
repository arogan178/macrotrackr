import { describe, expect, it } from "vitest";

import {
  FREE_PLAN_DEFINITION,
  PRICING as SHARED_PRICING,
  PRO_PLAN_DEFINITION,
} from "../../../shared/pricing";

import { PRICING, PRICING_PLANS } from "./pricing";

describe("config/pricing", () => {
  it("maps free and pro plans to shared definitions", () => {
    expect(PRICING_PLANS.free.name).toBe(FREE_PLAN_DEFINITION.name);
    expect(PRICING_PLANS.pro.name).toBe(PRO_PLAN_DEFINITION.name);
    expect(PRICING_PLANS.pro.price).toBe(SHARED_PRICING.monthly);
  });

  it("keeps feature arrays decoupled from shared constants", () => {
    expect(PRICING_PLANS.free.features).toEqual(FREE_PLAN_DEFINITION.features);
    expect(PRICING_PLANS.pro.features).toEqual(PRO_PLAN_DEFINITION.features);

    expect(PRICING_PLANS.free.features).not.toBe(FREE_PLAN_DEFINITION.features);
    expect(PRICING_PLANS.pro.features).not.toBe(PRO_PLAN_DEFINITION.features);
  });

  it("exports the shared pricing object", () => {
    expect(PRICING).toEqual(SHARED_PRICING);
    expect(PRICING.monthly).toBeTypeOf("number");
    expect(PRICING.yearly).toBeTypeOf("number");
  });

  it("marks pro as popular and free as a ghost button", () => {
    expect(PRICING_PLANS.pro.isPopular).toBe(true);
    expect(PRICING_PLANS.free.buttonVariant).toBe("ghost");
  });
});

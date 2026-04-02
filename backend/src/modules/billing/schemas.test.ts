import { Value } from "@sinclair/typebox/value";
import { describe, expect, it } from "vitest";

import { BillingSchemas } from "./schemas";

describe("BillingSchemas", () => {
  it("accepts a valid checkout session payload", () => {
    const payload = {
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
      metadata: {
        source: "pricing-page",
      },
    };

    expect(Value.Check(BillingSchemas.createCheckoutSession, payload)).toBe(true);
  });

  it("rejects checkout payloads that miss required urls", () => {
    const invalidPayload = {
      successUrl: "https://app.example.com/success",
    };

    expect(Value.Check(BillingSchemas.createCheckoutSession, invalidPayload)).toBe(false);
  });

  it("enforces subscription status literals", () => {
    expect(
      Value.Check(BillingSchemas.subscriptionStatus, {
        status: "active",
        currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      }),
    ).toBe(true);

    expect(
      Value.Check(BillingSchemas.subscriptionStatus, {
        status: "paused",
        currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      }),
    ).toBe(false);
  });

  it("enforces plan interval literals", () => {
    const validPlan = {
      id: "pro-monthly",
      name: "Pro",
      description: "Unlimited tracking",
      price: 999,
      currency: "usd",
      interval: "month",
      features: ["Advanced insights"],
    };

    const invalidPlan = {
      ...validPlan,
      interval: "weekly",
    };

    expect(Value.Check(BillingSchemas.subscriptionPlan, validPlan)).toBe(true);
    expect(Value.Check(BillingSchemas.subscriptionPlan, invalidPlan)).toBe(false);
  });
});

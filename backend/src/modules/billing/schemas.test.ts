import { Value } from "@sinclair/typebox/value";
import { FormatRegistry } from "@sinclair/typebox";
import { describe, expect, it } from "vitest";

import { BillingSchemas } from "./schemas";

const checkSchema = (schema: unknown, payload: unknown): boolean =>
  Value.Check(schema as Parameters<typeof Value.Check>[0], payload);

if (!FormatRegistry.Has("uri")) {
  FormatRegistry.Set("uri", (value) => {
    try {
      const candidate = new URL(value);
      return candidate.protocol === "http:" || candidate.protocol === "https:";
    } catch {
      return false;
    }
  });
}

if (!FormatRegistry.Has("date-time")) {
  FormatRegistry.Set("date-time", (value) => !Number.isNaN(Date.parse(value)));
}

describe("BillingSchemas", () => {
  it("accepts a valid checkout session payload", () => {
    const payload = {
      successUrl: "https://app.example.com/success",
      cancelUrl: "https://app.example.com/cancel",
      metadata: {
        source: "pricing-page",
      },
    };

    expect(checkSchema(BillingSchemas.createCheckoutSession, payload)).toBe(true);
  });

  it("rejects checkout payloads that miss required urls", () => {
    const invalidPayload = {
      successUrl: "https://app.example.com/success",
    };

    expect(checkSchema(BillingSchemas.createCheckoutSession, invalidPayload)).toBe(false);
  });

  it("enforces subscription status literals", () => {
    expect(
      checkSchema(BillingSchemas.subscriptionStatus, {
        status: "active",
        currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      }),
    ).toBe(true);

    expect(
      checkSchema(BillingSchemas.subscriptionStatus, {
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

    expect(checkSchema(BillingSchemas.subscriptionPlan, validPlan)).toBe(true);
    expect(checkSchema(BillingSchemas.subscriptionPlan, invalidPlan)).toBe(false);
  });
});

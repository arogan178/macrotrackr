import { describe, expect, it } from "vitest";

import parseBillingError from "./parseBillingError";

describe("parseBillingError", () => {
  it("parses network errors", () => {
    const result = parseBillingError(new Error("Network connection failed"));
    expect(result.type).toBe("network");
    expect(result.retryable).toBe(true);
  });

  it("parses fetch errors as network", () => {
    const result = parseBillingError(new Error("fetch failed"));
    expect(result.type).toBe("network");
  });

  it("parses stripe errors", () => {
    const result = parseBillingError(new Error("Stripe payment failed"));
    expect(result.type).toBe("stripe");
    expect(result.retryable).toBe(true);
  });

  it("parses payment errors as stripe", () => {
    const result = parseBillingError(new Error("Payment declined"));
    expect(result.type).toBe("stripe");
  });

  it("parses auth errors", () => {
    const result = parseBillingError(new Error("Unauthorized access"));
    expect(result.type).toBe("auth");
    expect(result.retryable).toBe(false);
  });

  it("returns unknown for unrecognized errors", () => {
    const result = parseBillingError(new Error("Some random error"));
    expect(result.type).toBe("unknown");
    expect(result.retryable).toBe(true);
  });

  it("handles non-Error objects", () => {
    const result = parseBillingError("string error");
    expect(result.type).toBe("unknown");
    expect(result.message).toBe("An unexpected error occurred. Please try again.");
  });
});

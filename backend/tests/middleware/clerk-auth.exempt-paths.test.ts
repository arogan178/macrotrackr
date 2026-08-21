import { describe, expect, it } from "vitest";

import { isExemptPath } from "../../src/middleware/clerk-auth";

/**
 * These paths are called by machines that have no Clerk session. Gating any of
 * them behind auth does not fail loudly, it just silently stops the provider
 * from ever reaching us, which shows up weeks later as subscriptions that
 * never expire.
 */
describe("isExemptPath", () => {
  it("exempts the Google Play notification endpoint, whatever the secret is", () => {
    expect(isExemptPath("/api/billing/play/rtdn/some-long-secret")).toBe(true);
    expect(isExemptPath("/api/billing/play/rtdn/another-secret-entirely")).toBe(
      true,
    );
  });

  it("exempts the billing capabilities endpoint, read before sign-in", () => {
    expect(isExemptPath("/api/billing/capabilities")).toBe(true);
  });

  it("exempts the Stripe webhook", () => {
    expect(isExemptPath("/api/billing/webhook")).toBe(true);
  });

  it("exempts Clerk webhooks", () => {
    expect(isExemptPath("/api/webhooks/clerk")).toBe(true);
  });

  it("still guards the endpoint that grants Pro from a purchase token", () => {
    // This one must stay authenticated: it attaches a purchase to whoever is
    // signed in, so an unauthenticated caller has no account to attach to.
    expect(isExemptPath("/api/billing/play/verify")).toBe(false);
  });

  it("still guards the rest of billing", () => {
    expect(isExemptPath("/api/billing/checkout")).toBe(false);
    expect(isExemptPath("/api/billing/cancel")).toBe(false);
    expect(isExemptPath("/api/billing/details")).toBe(false);
    expect(isExemptPath("/api/billing/subscription-status")).toBe(false);
  });

  it("does not exempt a path that merely looks like the RTDN one", () => {
    expect(isExemptPath("/api/billing/play/rtdn")).toBe(false);
    expect(isExemptPath("/api/billing/play")).toBe(false);
  });

  it("still guards ordinary application routes", () => {
    expect(isExemptPath("/api/macros/entries")).toBe(false);
    expect(isExemptPath("/api/user/me")).toBe(false);
  });
});

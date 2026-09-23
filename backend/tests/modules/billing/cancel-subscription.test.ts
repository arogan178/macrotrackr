import { describe, expect, it, vi } from "vitest";

const updateMock = vi.fn();
const cancelMock = vi.fn();

vi.mock("stripe", () => ({
  default: class {
    subscriptions = { update: updateMock, cancel: cancelMock };
  },
}));

vi.mock("../../../src/config", () => ({
  config: { STRIPE_SECRET_KEY: "sk_test_123" },
}));

import { StripeService } from "../../../src/modules/billing/stripe-service";

describe("StripeService.cancelSubscription", () => {
  it("stops renewal instead of ending the paid period early", async () => {
    updateMock.mockResolvedValueOnce({ id: "sub_1", status: "active" });

    await StripeService.cancelSubscription("sub_1");

    expect(updateMock).toHaveBeenCalledWith("sub_1", {
      cancel_at_period_end: true,
    });
    expect(cancelMock).not.toHaveBeenCalled();
  });
});

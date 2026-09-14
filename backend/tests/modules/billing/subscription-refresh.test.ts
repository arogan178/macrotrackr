import { beforeEach, describe, expect, it, vi } from "vitest";

const safeQueryMock = vi.fn();
const safeExecuteMock = vi.fn();
const stripeGetSubscriptionMock = vi.fn();
const playGetSubscriptionMock = vi.fn();

vi.mock("../../../src/lib/data/database", () => ({
  safeQuery: (...arguments_: unknown[]) => safeQueryMock(...arguments_),
  safeExecute: (...arguments_: unknown[]) => safeExecuteMock(...arguments_),
  withTransaction: (_db: unknown, work: () => unknown) => work(),
}));

vi.mock("../../../src/modules/billing/stripe-service", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../../../src/modules/billing/stripe-service")
    >();

  return {
    normalizeStripeSubscription: actual.normalizeStripeSubscription,
    StripeService: {
      getSubscription: (...arguments_: unknown[]) =>
        stripeGetSubscriptionMock(...arguments_),
    },
  };
});

vi.mock("../../../src/modules/billing/play-service", () => ({
  PlayService: {
    getSubscription: (...arguments_: unknown[]) =>
      playGetSubscriptionMock(...arguments_),
  },
}));

import {
  configureSubscriptionService,
  SubscriptionService,
} from "../../../src/modules/billing/subscription-service";

const DAY = 24 * 60 * 60 * 1000;
// Whole seconds, because that is all a Stripe period end carries.
const inDays = (days: number) =>
  new Date(Math.floor((Date.now() + days * DAY) / 1000) * 1000).toISOString();

function storedSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_row_1",
    user_id: 2,
    provider: "stripe",
    provider_subscription_id: "sub_stripe_1",
    status: "active",
    current_period_end: inDays(-45),
    created_at: "2025-07-30 14:19:55",
    updated_at: "2025-07-30 14:19:55",
    ...overrides,
  };
}

function stripeSubscription(status: string, periodEnd: string) {
  return {
    id: "sub_stripe_1",
    status,
    items: {
      data: [
        { current_period_end: Math.floor(new Date(periodEnd).getTime() / 1000) },
      ],
    },
  };
}

describe("hasActiveProSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const entries = new Map<string, unknown>();
    configureSubscriptionService({
      db: { kind: "test-db" } as never,
      cacheService: {
        get: (key: string) => entries.get(key) ?? null,
        set: (key: string, value: unknown) => entries.set(key, value),
      } as never,
    });
    safeExecuteMock.mockReturnValue({ changes: 1 });
  });

  it("grants Pro without asking the provider while the stored period is live", async () => {
    safeQueryMock.mockReturnValueOnce(
      storedSubscription({ current_period_end: inDays(300) }),
    );

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(true);
    expect(stripeGetSubscriptionMock).not.toHaveBeenCalled();
  });

  it("denies Pro when there is no active subscription row", async () => {
    safeQueryMock.mockReturnValueOnce(null);

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(false);
    expect(stripeGetSubscriptionMock).not.toHaveBeenCalled();
  });

  it("restores Pro when the stored period has lapsed but Stripe has renewed", async () => {
    const renewedEnd = inDays(320);
    stripeGetSubscriptionMock.mockResolvedValue(
      stripeSubscription("active", renewedEnd),
    );
    safeQueryMock
      .mockReturnValueOnce(storedSubscription())
      .mockReturnValueOnce(storedSubscription())
      .mockReturnValueOnce(
        storedSubscription({ current_period_end: renewedEnd }),
      );

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(true);
    expect(stripeGetSubscriptionMock).toHaveBeenCalledWith("sub_stripe_1");
    // The renewal must land on the row and on the status the UI reads.
    expect(safeExecuteMock.mock.calls[0]?.[2]).toContain(renewedEnd);
    expect(safeExecuteMock.mock.calls[1]?.[2]).toContain("pro");
  });

  it("denies Pro when the provider confirms the subscription is over", async () => {
    const lapsedEnd = inDays(-45);
    stripeGetSubscriptionMock.mockResolvedValue(
      stripeSubscription("canceled", lapsedEnd),
    );
    safeQueryMock
      .mockReturnValueOnce(storedSubscription())
      .mockReturnValueOnce(storedSubscription())
      .mockReturnValueOnce(
        storedSubscription({ status: "canceled", current_period_end: lapsedEnd }),
      );

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(false);
  });

  it("denies Pro, without throwing, when the provider cannot be reached", async () => {
    stripeGetSubscriptionMock.mockRejectedValue(new Error("stripe is down"));
    safeQueryMock.mockReturnValue(storedSubscription());

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(false);
  });

  it("asks the provider once, not on every gated request", async () => {
    stripeGetSubscriptionMock.mockRejectedValue(new Error("stripe is down"));
    safeQueryMock.mockReturnValue(storedSubscription());

    await SubscriptionService.hasActiveProSubscription(2);
    await SubscriptionService.hasActiveProSubscription(2);

    expect(stripeGetSubscriptionMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes a lapsed Play subscription from Google", async () => {
    const renewedEnd = inDays(25);
    playGetSubscriptionMock.mockResolvedValue({
      status: "active",
      currentPeriodEnd: renewedEnd,
    });
    const playRow = storedSubscription({
      provider: "play",
      provider_subscription_id: "play_token_1",
    });
    safeQueryMock
      .mockReturnValueOnce(playRow)
      .mockReturnValueOnce(playRow)
      .mockReturnValueOnce({ ...playRow, current_period_end: renewedEnd });

    expect(await SubscriptionService.hasActiveProSubscription(2)).toBe(true);
    expect(playGetSubscriptionMock).toHaveBeenCalledWith("play_token_1");
    expect(stripeGetSubscriptionMock).not.toHaveBeenCalled();
  });
});

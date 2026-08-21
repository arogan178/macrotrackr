import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCanPurchaseHere } from "./useCanPurchaseHere";

const useQuery = vi.fn();
const isPlayBillingAvailable = vi.fn();
const playProductIdFor = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQuery: (options: unknown) => useQuery(options),
}));

vi.mock("@/services/native/playBilling", () => ({
  isPlayBillingAvailable: () => isPlayBillingAvailable(),
}));

vi.mock("@/config/runtime", () => ({
  playProductIdFor: (plan: string) => playProductIdFor(plan),
}));

vi.mock("@/api/billing", () => ({
  billingApi: { getCapabilities: vi.fn() },
}));

const answered = (data: { web: boolean; play: boolean }) => ({
  data,
  isPending: false,
  isError: false,
});

describe("useCanPurchaseHere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    playProductIdFor.mockReturnValue("pro_monthly");
  });

  describe("on the web", () => {
    beforeEach(() => {
      isPlayBillingAvailable.mockReturnValue(false);
    });

    it("sells through Stripe when the server has web billing on", () => {
      useQuery.mockReturnValue(answered({ web: true, play: false }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(true);
      expect(result.current.provider).toBe("stripe");
    });

    it("draws no button when the server has web billing off", () => {
      useQuery.mockReturnValue(answered({ web: false, play: false }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
    });

    it("ignores Play product ids, which are irrelevant off Android", () => {
      playProductIdFor.mockReturnValue(null);
      useQuery.mockReturnValue(answered({ web: true, play: false }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(true);
    });
  });

  describe("on Google Play", () => {
    beforeEach(() => {
      isPlayBillingAvailable.mockReturnValue(true);
    });

    it("sells when the server honours Play and the build has product ids", () => {
      useQuery.mockReturnValue(answered({ web: true, play: true }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(true);
      expect(result.current.provider).toBe("play");
    });

    it("refuses when the server would reject the purchase", () => {
      // The case that took money and gave nothing: Play products exist, so a
      // purchase completes, but the server is not configured to honour it.
      useQuery.mockReturnValue(answered({ web: true, play: false }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
    });

    it("refuses when the build has no product ids compiled in", () => {
      playProductIdFor.mockReturnValue(null);
      useQuery.mockReturnValue(answered({ web: true, play: true }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
    });

    it("refuses when only one of the two plans is configured", () => {
      playProductIdFor.mockImplementation((plan: string) =>
        plan === "monthly" ? "pro_monthly" : null,
      );
      useQuery.mockReturnValue(answered({ web: true, play: true }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
    });

    it("does not fall back to web billing, which Play policy forbids", () => {
      useQuery.mockReturnValue(answered({ web: true, play: false }));

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.provider).not.toBe("stripe");
    });
  });

  describe("before the server answers", () => {
    beforeEach(() => {
      isPlayBillingAvailable.mockReturnValue(true);
    });

    it("fails closed while the request is in flight", () => {
      useQuery.mockReturnValue({
        data: undefined,
        isPending: true,
        isError: false,
      });

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
      expect(result.current.isResolving).toBe(true);
    });

    it("fails closed when the request failed", () => {
      useQuery.mockReturnValue({
        data: undefined,
        isPending: false,
        isError: true,
      });

      const { result } = renderHook(() => useCanPurchaseHere());

      expect(result.current.canPurchase).toBe(false);
      expect(result.current.isResolving).toBe(false);
      expect(result.current.provider).toBeNull();
    });
  });
});

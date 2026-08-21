import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// vitest hoists vi.mock above imports, so the module under test can be
// imported here even though its mocks are declared below.
import { useRecoverPlayPurchases } from "./useRecoverPlayPurchases";

const verifyPlayPurchase = vi.fn();
const getUnverifiedPurchases = vi.fn();
const isPlayBillingAvailable = vi.fn();
const setSubscriptionStatus = vi.fn();

let authState = { isLoaded: true, isSignedIn: true };
let entitlements = { hasProAccess: false };

vi.mock("@/api/billing", () => ({
  billingApi: {
    verifyPlayPurchase: (token: string) => verifyPlayPurchase(token),
  },
}));

vi.mock("@/services/native/playBilling", () => ({
  getUnverifiedPurchases: () => getUnverifiedPurchases(),
  isPlayBillingAvailable: () => isPlayBillingAvailable(),
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => authState,
}));

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => entitlements,
}));

vi.mock("@/hooks/useSubscriptionStatus", () => ({
  useSubscriptionStatus: () => ({ setSubscriptionStatus }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn() },
}));

describe("useRecoverPlayPurchases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { isLoaded: true, isSignedIn: true };
    entitlements = { hasProAccess: false };
    isPlayBillingAvailable.mockReturnValue(true);
    getUnverifiedPurchases.mockResolvedValue([]);
  });

  it("claims a purchase Play is holding that the server never saw", async () => {
    getUnverifiedPurchases.mockResolvedValue(["token_abc"]);
    verifyPlayPurchase.mockResolvedValue({ entitled: true });

    renderHook(() => useRecoverPlayPurchases());

    await waitFor(() => {
      expect(verifyPlayPurchase).toHaveBeenCalledWith("token_abc");
    });
    await waitFor(() => {
      expect(setSubscriptionStatus).toHaveBeenCalledWith("pro");
    });
  });

  it("does nothing when the account already has Pro", async () => {
    entitlements = { hasProAccess: true };
    getUnverifiedPurchases.mockResolvedValue(["token_abc"]);

    renderHook(() => useRecoverPlayPurchases());

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getUnverifiedPurchases).not.toHaveBeenCalled();
    expect(verifyPlayPurchase).not.toHaveBeenCalled();
  });

  it("does nothing off Google Play, so the web never calls this", async () => {
    isPlayBillingAvailable.mockReturnValue(false);

    renderHook(() => useRecoverPlayPurchases());

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getUnverifiedPurchases).not.toHaveBeenCalled();
  });

  it("waits for sign-in, since the purchase attaches to an account", async () => {
    authState = { isLoaded: true, isSignedIn: false };

    renderHook(() => useRecoverPlayPurchases());

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getUnverifiedPurchases).not.toHaveBeenCalled();
  });

  it("keeps quiet when verification fails, leaving it to the renewal notification", async () => {
    getUnverifiedPurchases.mockResolvedValue(["token_abc"]);
    verifyPlayPurchase.mockRejectedValue(new Error("network down"));

    renderHook(() => useRecoverPlayPurchases());

    await waitFor(() => {
      expect(verifyPlayPurchase).toHaveBeenCalled();
    });
    expect(setSubscriptionStatus).not.toHaveBeenCalled();
  });

  it("moves past a token that is no longer worth anything", async () => {
    getUnverifiedPurchases.mockResolvedValue(["expired_token", "good_token"]);
    verifyPlayPurchase
      .mockResolvedValueOnce({ entitled: false })
      .mockResolvedValueOnce({ entitled: true });

    renderHook(() => useRecoverPlayPurchases());

    await waitFor(() => {
      expect(verifyPlayPurchase).toHaveBeenCalledTimes(2);
    });
    expect(setSubscriptionStatus).toHaveBeenCalledWith("pro");
  });

  it("runs once per app start, not on every render", async () => {
    getUnverifiedPurchases.mockResolvedValue(["token_abc"]);
    verifyPlayPurchase.mockResolvedValue({ entitled: true });

    const { rerender } = renderHook(() => useRecoverPlayPurchases());

    await waitFor(() => {
      expect(getUnverifiedPurchases).toHaveBeenCalledTimes(1);
    });

    rerender();
    rerender();

    expect(getUnverifiedPurchases).toHaveBeenCalledTimes(1);
  });
});

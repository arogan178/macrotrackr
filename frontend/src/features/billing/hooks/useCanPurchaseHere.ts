import { useQuery } from "@tanstack/react-query";

import { billingApi } from "@/api/billing";
import { playProductIdFor } from "@/config/runtime";
import { isPlayBillingAvailable } from "@/services/native/playBilling";

const CAPABILITIES_QUERY_KEY = ["billing", "capabilities"] as const;

/**
 * What the server is configured to sell. Cached hard because it only changes
 * when the deployment is reconfigured, and the pricing page should not wait on
 * a network round trip to decide whether to draw a button.
 */
function useBillingCapabilities() {
  return useQuery({
    queryKey: CAPABILITIES_QUERY_KEY,
    queryFn: () => billingApi.getCapabilities(),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1,
  });
}

export interface PurchaseCapability {
  /** Draw upgrade buttons only when this is true. */
  canPurchase: boolean;
  /** True until the server has answered. Treat as "do not sell yet". */
  isResolving: boolean;
  /** Which rail a purchase would use, for choosing the checkout path. */
  provider: "stripe" | "play" | null;
}

/**
 * Whether Pro can be bought from this build, right now.
 *
 * Three things have to agree, and historically they did not:
 *
 *  1. the platform, because Play Billing only exists in the Android build
 *  2. the build, because the Android build needs product ids compiled in
 *  3. the server, because it has to be configured to honour the purchase
 *
 * When they disagree the honest answer is "no", which draws no button. The
 * alternative was a button that opened Play, took the money, and then had
 * /play/verify refuse it.
 */
export function useCanPurchaseHere(): PurchaseCapability {
  const { data, isPending, isError } = useBillingCapabilities();
  const onPlay = isPlayBillingAvailable();

  // Fail closed. A server that cannot be reached has not said yes.
  if (isPending || isError || !data) {
    return {
      canPurchase: false,
      isResolving: isPending,
      provider: null,
    };
  }

  if (onPlay) {
    const hasProductIds =
      playProductIdFor("monthly") !== null && playProductIdFor("yearly") !== null;

    return {
      canPurchase: data.play && hasProductIds,
      isResolving: false,
      provider: "play",
    };
  }

  return {
    canPurchase: data.web,
    isResolving: false,
    provider: "stripe",
  };
}

import { useEffect, useRef } from "react";

import { billingApi } from "@/api/billing";
import { useAppAuthState } from "@/hooks/auth/useAuthState";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { logger } from "@/lib/logger";
import {
  getUnverifiedPurchases,
  isPlayBillingAvailable,
} from "@/services/native/playBilling";

/**
 * Claim Play purchases the server never heard about.
 *
 * The failure this exists for: Play takes the money, then the verify call fails
 * because the network dropped or the app was killed. Without this the user has
 * paid and has nothing, and the only other route back is the renewal
 * notification a month later.
 *
 * Runs once per app start, and only when Play is the store and the account is
 * not already on Pro, so the normal case costs nothing.
 */
export function useRecoverPlayPurchases(): void {
  const { isLoaded, isSignedIn } = useAppAuthState();
  const { hasProAccess } = useEntitlements();
  const { setSubscriptionStatus } = useSubscriptionStatus();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    if (!isLoaded || !isSignedIn) return;
    if (!isPlayBillingAvailable()) return;
    // Already Pro, so there is nothing to recover.
    if (hasProAccess) return;

    hasRun.current = true;

    void (async () => {
      const purchaseTokens = await getUnverifiedPurchases();
      if (purchaseTokens.length === 0) return;

      for (const purchaseToken of purchaseTokens) {
        try {
          const verification =
            await billingApi.verifyPlayPurchase(purchaseToken);

          if (verification.entitled) {
            setSubscriptionStatus("pro");
            logger.info("Recovered a Google Play purchase for this account");

            return;
          }
        } catch (error) {
          // Nothing to tell the user: they did not ask for this, and the
          // renewal notification is the other way back in.
          logger.warn("Could not claim a Google Play purchase", error);
        }
      }
    })();
  }, [isLoaded, isSignedIn, hasProAccess, setSubscriptionStatus]);
}

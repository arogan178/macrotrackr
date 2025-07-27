// Centralizes user subscription status hydration for feature pages

import { useEffect } from "react";

import { useUser } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

/**
 * usePageDataSync
 * - Hydrates subscription status from user data into the global store.
 * - Can be extended for other cross-page user data sync needs.
 */
export function usePageDataSync() {
  const { data: user } = useUser();
  const { setSubscriptionStatus } = useStore();

  useEffect(() => {
    if (
      user &&
      user.subscription &&
      typeof user.subscription.status === "string"
    ) {
      setSubscriptionStatus(user.subscription.status);
    }
  }, [user, setSubscriptionStatus]);
}

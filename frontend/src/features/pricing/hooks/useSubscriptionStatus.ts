import { useEffect } from "react";

import { useStore } from "@/store/store";
import { apiService } from "@/utils/apiServices";

interface UserWithSubscription {
  subscription?: {
    status?: string;
  };
}

const allowedStatuses = ["free", "pro", "canceled"] as const;
type SubscriptionStatus = (typeof allowedStatuses)[number];

export function useSubscriptionStatus() {
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useStore((s) => s.setSubscriptionStatus);
  const isAuthenticated = useStore((s) => s.auth.isAuthenticated);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!isAuthenticated) {
        setSubscriptionStatus("free");
        return;
      }
      try {
        const user =
          (await apiService.user.getUserDetails()) as UserWithSubscription;
        let status: SubscriptionStatus = "free";
        if (user && user.subscription && user.subscription.status) {
          const rawStatus = user.subscription.status;
          if (allowedStatuses.includes(rawStatus as SubscriptionStatus)) {
            status = rawStatus as SubscriptionStatus;
          }
        }
        setSubscriptionStatus(status);
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        setSubscriptionStatus("free");
      }
    };

    fetchStatus();
  }, [isAuthenticated, setSubscriptionStatus]);

  return { subscriptionStatus, setSubscriptionStatus };
}

/**
 * Usage example:
 * const { subscriptionStatus } = useSubscriptionStatus();
 * if (subscriptionStatus === 'pro') { ... }
 */

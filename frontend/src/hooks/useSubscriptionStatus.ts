import { useUserStore } from "@/store/userSlice";
import { useEffect } from "react";

export function useSubscriptionStatus() {
  const subscriptionStatus = useUserStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useUserStore((s) => s.setSubscriptionStatus);

  // Example: fetch status on mount (replace with real API call)
  useEffect(() => {
    // fetch('/api/user/me').then(...)
    // setSubscriptionStatus('pro' | 'free' | 'canceled');
  }, [setSubscriptionStatus]);

  return { subscriptionStatus, setSubscriptionStatus };
}

/**
 * Usage example:
 * const { subscriptionStatus } = useSubscriptionStatus();
 * if (subscriptionStatus === 'pro') { ... }
 */

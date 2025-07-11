import { useEffect } from "react";

import { useStore } from "@/store/store";

export function useSubscriptionStatus() {
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useStore((s) => s.setSubscriptionStatus);

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

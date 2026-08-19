import { resolveEntitlements } from "@shared/entitlements";

import { isLocalAuthMode } from "@/config/runtime";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

export function useEntitlements() {
  const { subscriptionStatus } = useSubscriptionStatus();

  return resolveEntitlements({
    isSelfHosted: isLocalAuthMode,
    subscriptionStatus,
  });
}

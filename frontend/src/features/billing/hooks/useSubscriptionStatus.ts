import { useUser } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

interface UserWithSubscription {
  subscription?: {
    status?: "free" | "pro" | "canceled";
    hasStripeCustomer?: boolean;
    currentPeriodEnd?: string | undefined;
  };
}

const allowedStatuses = ["free", "pro", "canceled"] as const;
type SubscriptionStatus = (typeof allowedStatuses)[number];

export function useSubscriptionStatus() {
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useStore((s) => s.setSubscriptionStatus);
  const { data: user } = useUser();
  const isAuthenticated = !!user;

  // Removed effect that overwrites subscriptionStatus

  return { subscriptionStatus, setSubscriptionStatus };
}

import { useUser } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

export function useSubscriptionStatus() {
  const subscriptionStatus = useStore((s) => s.subscriptionStatus);
  const setSubscriptionStatus = useStore((s) => s.setSubscriptionStatus);
  // keep user read to ensure subscriptionStatus can be derived elsewhere without unused locals
  useUser();

  return { subscriptionStatus, setSubscriptionStatus };
}

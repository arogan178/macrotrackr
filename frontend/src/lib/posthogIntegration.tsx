import { useEffect, useRef } from "react";
import { usePostHog } from "posthog-js/react";

import { useUser } from "@/hooks/auth/useAuthQueries";

/**
 * PostHogUserSync
 * - Calls posthog.identify(...) as soon as we have a logged-in user
 * - Sets person properties from the user profile
 * - Calls posthog.reset(true) when the user logs out to avoid mixing sessions
 *
 * This component should be mounted inside the PostHogProvider so
 * usePostHog() returns the initialized PostHog instance.
 */
export default function PostHogUserSync(): undefined {
  const posthog = usePostHog();
  const { data: user } = useUser({ enabled: true });
  const lastDistinctIdReference = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!posthog) return;

    // If we have a user, identify them and set person properties
    if (user) {
      const distinctId = String(user.id);

      // Avoid calling identify repeatedly for the same id
      if (lastDistinctIdReference.current !== distinctId) {
        try {
          posthog.identify(distinctId, {
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            subscription_status: user.subscription?.status,
            created_at: user.createdAt,
          });
        } catch (error) {
          // Don't throw in UI if analytics fails
          console.warn("PostHog identify failed:", error);
        }

        lastDistinctIdReference.current = distinctId;
      }
      return;
    }

    // If user is undefined (logged out), reset PostHog to unlink device from user
    if (!user && lastDistinctIdReference.current) {
      try {
        // reset(true) also resets the device id so future events are treated as new device
        posthog.reset(true);
      } catch (error) {
        console.warn("PostHog reset failed:", error);
      }
      lastDistinctIdReference.current = undefined;
    }
  }, [posthog, user]);

  return undefined;
}

import { useEffect, useRef } from "react";

import { useUser } from "@/hooks/auth/useAuthQueries";

import { withPostHog } from "./posthogClient";

/**
 * PostHogUserSync
 * - Calls posthog.identify(...) as soon as we have a logged-in user
 * - Sets person properties from the user profile
 * - Calls posthog.reset(true) when the user logs out to avoid mixing sessions
 * - Starts and stops session replay, which `main.tsx` leaves off at init so a
 *   marketing visitor never pays for the recorder
 */
export default function PostHogUserSync(): undefined {
  const { data: user } = useUser({ enabled: true });
  const lastDistinctIdReference = useRef<string | undefined>(undefined);

  useEffect(() => {
    // If we have a user, identify them and set person properties
    if (user) {
      const distinctId = String(user.id);

      // Avoid calling identify repeatedly for the same id
      if (lastDistinctIdReference.current !== distinctId) {
        lastDistinctIdReference.current = distinctId;
        withPostHog((posthog) => {
          try {
            // Identify by internal id only. No email or name leaves the app.
            posthog.identify(distinctId, {
              subscription_status: user.subscription.status,
              created_at: user.createdAt,
              traffic_type: user.analyticsTrafficType,
              switching_source: user.switchingSource ?? "unknown",
            });
          } catch (error) {
            // Don't throw in UI if analytics fails
            console.warn("PostHog identify failed:", error);
          }
        });
      }

      // Signed in, so there is a session worth replaying. Safe to call when
      // already recording: posthog no-ops rather than restarting.
      withPostHog((posthog) => {
        try {
          posthog.startSessionRecording();
        } catch (error) {
          console.warn("PostHog session recording failed to start:", error);
        }
      });

      return;
    }

    // If user is undefined (logged out), reset PostHog to unlink device from user
    if (lastDistinctIdReference.current) {
      lastDistinctIdReference.current = undefined;
      withPostHog((posthog) => {
        try {
          // Stop before reset, so the recorder does not keep running against a
          // device id that no longer maps to anyone.
          posthog.stopSessionRecording();
          // reset(true) also resets the device id so future events are treated as new device
          posthog.reset(true);
        } catch (error) {
          console.warn("PostHog reset failed:", error);
        }
      });
    }
  }, [user]);

  return undefined;
}

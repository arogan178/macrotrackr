import { useEffect, useRef } from "react";

import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAppAuthState } from "@/hooks/auth/useAuthState";

import { withPostHog } from "./posthogClient";

/**
 * PostHogUserSync
 * - Calls posthog.identify(...) as soon as we have a logged-in user
 * - Sets person properties from the user profile
 * - Calls posthog.reset(true) once there is no session, so the next person on
 *   this device is not analysed as the last one
 * - Starts and stops session replay, which `main.tsx` leaves off at init so a
 *   marketing visitor never pays for the recorder
 */
export default function PostHogUserSync(): undefined {
  const { isLoaded, isSignedIn } = useAppAuthState();
  const { data: user } = useUser({ enabled: true });
  const lastDistinctIdReference = useRef<string | undefined>(undefined);
  const isSignedOut = isLoaded && !isSignedIn;

  useEffect(() => {
    // Not `user`: logout clears the query cache without re-rendering this
    // component, so the last profile it saw outlives the session.
    if (isSignedOut) {
      lastDistinctIdReference.current = undefined;
      withPostHog((posthog) => {
        // PostHog's persisted state rather than the ref, so a reload after
        // signing out still unlinks the device.
        if (!posthog._isIdentified()) return;
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

      return;
    }

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
    }
  }, [isSignedOut, user]);

  return undefined;
}

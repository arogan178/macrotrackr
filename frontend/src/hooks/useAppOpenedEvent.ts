import { useEffect } from "react";

import { useProductAnalytics } from "@/lib/productAnalytics";
import { getPlatform } from "@/services/native/platform";

/** Away at least this long counts as coming back, not switching apps for a moment. */
const RESUME_GAP_MS = 30 * 60 * 1000;

// Once per page load, however often the signed-in layout remounts.
let hasReportedLaunch = false;

/**
 * Whether people come back is the number that matters, and nothing recorded
 * it: long sessions skip the login page, so logins undercount returns. This
 * reports a signed-in launch, and a return to the foreground after a gap.
 */
export function useAppOpenedEvent(isSignedIn: boolean): void {
  const analytics = useProductAnalytics();

  useEffect(() => {
    if (!isSignedIn) return;
    const platform = getPlatform();

    if (!hasReportedLaunch) {
      hasReportedLaunch = true;
      analytics.capture({ event: "app_opened", properties: { platform, trigger: "launch" } });
    }

    let hiddenAt: number | undefined;
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();

        return;
      }
      if (hiddenAt !== undefined && Date.now() - hiddenAt >= RESUME_GAP_MS) {
        analytics.capture({ event: "app_opened", properties: { platform, trigger: "resume" } });
      }
      hiddenAt = undefined;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [isSignedIn, analytics]);
}

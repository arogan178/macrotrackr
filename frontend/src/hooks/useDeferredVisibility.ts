import { useEffect, useRef, useState } from "react";

/**
 * Debounce showing a boolean and keep it visible for a minimum duration once shown.
 * Useful to prevent flicker in loading indicators.
 */
export default function useDeferredVisibility(
  active: boolean,
  options?: { delayMs?: number; minVisibleMs?: number },
) {
  const delayMs = options?.delayMs ?? 200;
  const minVisibleMs = options?.minVisibleMs ?? 400;

  const [visible, setVisible] = useState(false);
  const showTimerReference = useRef<number | undefined>(undefined);
  const hideTimerReference = useRef<number | undefined>(undefined);
  const lastShownAtReference = useRef<number | undefined>(undefined);

  useEffect(() => {
    

    // When becoming active: start debounce to show
    if (active) {
      // Cancel any pending hide
      if (hideTimerReference.current) {
        globalThis.clearTimeout(hideTimerReference.current);
        hideTimerReference.current = undefined;
      }
      // If already visible, nothing to do
      if (visible) {
        return;
      }
      // Debounce showing
      if (!showTimerReference.current) {
        showTimerReference.current = globalThis.setTimeout(() => {
          setVisible(true);
          lastShownAtReference.current = Date.now();
          showTimerReference.current = undefined;
        }, delayMs);
      }
      return () => {
        // no-op on cleanup here
      };
    }

    // When becoming inactive: either hide immediately if min time elapsed,
    // or schedule hide after the remaining time
    if (!active) {
      if (showTimerReference.current) {
        // Cancel pending show if we never showed
        globalThis.clearTimeout(showTimerReference.current);
        showTimerReference.current = undefined;
      }

      if (!visible) {
        // Not visible, nothing to do
        return;
      }

      const shownAt = lastShownAtReference.current ?? Date.now();
      const elapsed = Date.now() - shownAt;
      const remaining = Math.max(0, minVisibleMs - elapsed);

      if (remaining === 0) {
        setVisible(false);
      } else {
        if (!hideTimerReference.current) {
          hideTimerReference.current = globalThis.setTimeout(() => {
            setVisible(false);
            hideTimerReference.current = undefined;
          }, remaining);
        }
      }
    }

    return () => {
      // Cleanup on effect re-run or unmount when not clearly handled above
      // Do not clear timers needed for minVisibleMs on the inactivation path here,
      // only clear on unmount:
    };
  }, [active, delayMs, minVisibleMs, visible]);

  // On unmount: clear timers
  useEffect(() => {
    return () => {
      if (showTimerReference.current) {
        globalThis.clearTimeout(showTimerReference.current);
        showTimerReference.current = undefined;
      }
      if (hideTimerReference.current) {
        globalThis.clearTimeout(hideTimerReference.current);
        hideTimerReference.current = undefined;
      }
    };
  }, []);

  return visible;
}

import { useEffect, useRef, useState } from "react";

/**
 * Debounce showing a boolean and keep it visible for a minimum duration once shown.
 * Useful to prevent flicker in loading indicators.
 */
export default function useDeferredVisibility(
  active: boolean,
  options?: { delayMs?: number; minVisibleMs?: number }
) {
  const delayMs = options?.delayMs ?? 200;
  const minVisibleMs = options?.minVisibleMs ?? 400;

  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const lastShownAtRef = useRef<number | null>(null);

  useEffect(() => {
    // Clear timers helper
    const clearTimers = () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    // When becoming active: start debounce to show
    if (active) {
      // Cancel any pending hide
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      // If already visible, nothing to do
      if (visible) {
        return;
      }
      // Debounce showing
      if (!showTimerRef.current) {
        showTimerRef.current = window.setTimeout(() => {
          setVisible(true);
          lastShownAtRef.current = Date.now();
          showTimerRef.current = null;
        }, delayMs);
      }
      return () => {
        // no-op on cleanup here
      };
    }

    // When becoming inactive: either hide immediately if min time elapsed,
    // or schedule hide after the remaining time
    if (!active) {
      if (showTimerRef.current) {
        // Cancel pending show if we never showed
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }

      if (!visible) {
        // Not visible, nothing to do
        return;
      }

      const shownAt = lastShownAtRef.current ?? Date.now();
      const elapsed = Date.now() - shownAt;
      const remaining = Math.max(0, minVisibleMs - elapsed);

      if (remaining === 0) {
        setVisible(false);
      } else {
        if (!hideTimerRef.current) {
          hideTimerRef.current = window.setTimeout(() => {
            setVisible(false);
            hideTimerRef.current = null;
          }, remaining);
        }
      }
    }

    return () => {
      // Cleanup on effect re-run or unmount when not clearly handled above
      // Do not clear timers needed for minVisibleMs on the inactivation path here,
      // only clear on unmount:
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, delayMs, minVisibleMs, visible]);

  // On unmount: clear timers
  useEffect(() => {
    return () => {
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  return visible;
}
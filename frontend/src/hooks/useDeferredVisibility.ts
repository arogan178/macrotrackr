import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * Debounce showing a boolean and keep it visible for a minimum duration once shown.
 * Useful to prevent flicker in loading indicators.
 *
 * Optimized with useRef for transient timer values to avoid re-render subscriptions.
 */
export default function useDeferredVisibility(
  active: boolean,
  options?: { delayMs?: number; minVisibleMs?: number },
) {
  const delayMs = options?.delayMs ?? 200;
  const minVisibleMs = options?.minVisibleMs ?? 400;

  const [visible, setVisible] = useState(false);

  // Use refs for all transient values to avoid subscribing to them in effects
  const showTimerReference = useRef<number | undefined>(undefined);
  const hideTimerReference = useRef<number | undefined>(undefined);
  const lastShownAtReference = useRef<number | undefined>(undefined);
  const activeReference = useRef(active);

  // Sync ref immediately before paint to avoid stale values in effects
  useLayoutEffect(() => {
    activeReference.current = active;
  }, [active]);

  // Stable callback to show with proper timing
  const doShow = useCallback(() => {
    setVisible(true);
    lastShownAtReference.current = Date.now();
    showTimerReference.current = undefined;
  }, []);

  // Stable callback to hide
  const doHide = useCallback(() => {
    setVisible(false);
    hideTimerReference.current = undefined;
  }, []);

  useEffect(() => {
    // When becoming active: start debounce to show
    if (active) {
      // Cancel any pending hide
      if (hideTimerReference.current) {
        globalThis.clearTimeout(hideTimerReference.current);
        hideTimerReference.current = undefined;
      }
      // Debounce showing using stable callback
      if (!showTimerReference.current && !visible) {
        showTimerReference.current = globalThis.setTimeout(doShow, delayMs);
      }
    } else {
      // When becoming inactive
      if (showTimerReference.current) {
        globalThis.clearTimeout(showTimerReference.current);
        showTimerReference.current = undefined;
      }

      if (visible) {
        const shownAt = lastShownAtReference.current ?? Date.now();
        const elapsed = Date.now() - shownAt;
        const remaining = Math.max(0, minVisibleMs - elapsed);

        if (remaining === 0) {
          doHide();
        } else if (!hideTimerReference.current) {
          hideTimerReference.current = globalThis.setTimeout(doHide, remaining);
        }
      }
    }

    return () => {
      // Cleanup timers on unmount only
    };
    // Use primitive dependencies only - avoid subscribing to refs
  }, [active, delayMs, minVisibleMs, visible, doShow, doHide]);

  // On unmount: clear all timers
  useEffect(() => {
    return () => {
      if (showTimerReference.current) {
        globalThis.clearTimeout(showTimerReference.current);
      }
      if (hideTimerReference.current) {
        globalThis.clearTimeout(hideTimerReference.current);
      }
    };
  }, []);

  return visible;
}

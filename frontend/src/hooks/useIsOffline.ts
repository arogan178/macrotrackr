import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  globalThis.addEventListener("offline", onChange);
  globalThis.addEventListener("online", onChange);

  return () => {
    globalThis.removeEventListener("offline", onChange);
    globalThis.removeEventListener("online", onChange);
  };
}

// Bun and Node define `navigator` without `onLine`; only an explicit false is offline.
const getSnapshot = () => globalThis.navigator?.onLine === false;

// Prerendered pages are rendered online, and hydration has to start from the
// same answer before React re-reads the real one.
const getServerSnapshot = () => false;

/**
 * Tracks `navigator.onLine`.
 *
 * Reports whether the device has a network interface at all, not whether the
 * API is reachable — a captive portal reads as online. That is enough for the
 * two callers, which both only need to tell "no connection" apart from
 * "connection, but something else is wrong".
 */
export function useIsOffline(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

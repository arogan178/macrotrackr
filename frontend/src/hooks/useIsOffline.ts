import { useEffect, useState } from "react";

/**
 * Tracks `navigator.onLine`.
 *
 * Reports whether the device has a network interface at all, not whether the
 * API is reachable — a captive portal reads as online. That is enough for the
 * two callers, which both only need to tell "no connection" apart from
 * "connection, but something else is wrong".
 */
export function useIsOffline(): boolean {
  const [isOffline, setIsOffline] = useState(
    typeof navigator === "undefined" ? false : !navigator.onLine,
  );

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);

    globalThis.addEventListener("offline", goOffline);
    globalThis.addEventListener("online", goOnline);

    return () => {
      globalThis.removeEventListener("offline", goOffline);
      globalThis.removeEventListener("online", goOnline);
    };
  }, []);

  return isOffline;
}

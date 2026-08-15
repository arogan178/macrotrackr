import { useEffect, useState } from "react";

/**
 * The shell is precached, so offline the app opens and then every route fails
 * silently. This says so once, in one place, instead of leaving each panel to
 * render an unexplained empty state.
 */
const OfflineBar: React.FC = () => {
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

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 z-80 border-b border-border bg-surface-2 px-4 py-2 text-center text-xs text-muted"
      style={{ top: "var(--sat)" }}
    >
      Offline — showing the last data loaded. New entries will need a
      connection.
    </div>
  );
};

export default OfflineBar;

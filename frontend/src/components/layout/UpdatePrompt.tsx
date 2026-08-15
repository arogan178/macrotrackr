import { useCallback, useEffect, useState } from "react";

import Button from "@/components/ui/Button";

/**
 * The service worker deliberately leaves a new build in the waiting state so a
 * session never has its asset set swapped underneath it. Nothing told the user
 * that, though, so an update waited for every tab to close — which for an
 * installed app can be days. This is the opt-in: the user chooses the moment.
 */
const UpdatePrompt: React.FC = () => {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;

    const track = (registration: ServiceWorkerRegistration) => {
      if (registration.waiting) setWaiting(registration.waiting);

      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            if (!cancelled) setWaiting(installing);
          }
        });
      });
    };

    void navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration && !cancelled) track(registration);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waiting || isUpdating) return;
    setIsUpdating(true);

    // Reload once the new worker takes control, so the page and its chunks
    // always come from the same build.
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => globalThis.location.reload(),
      { once: true },
    );
    waiting.postMessage({ type: "SKIP_WAITING" });
  }, [waiting, isUpdating]);

  if (!waiting || dismissed) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 z-80 mx-auto flex max-w-md items-center justify-between gap-3 rounded-card border border-border bg-surface px-4 py-3"
      style={{ bottom: "calc(1rem + var(--sab))" }}
    >
      <p className="text-sm">A new version is ready.</p>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="ghost"
          buttonSize="sm"
          onClick={() => setDismissed(true)}
          disabled={isUpdating}
          text="Later"
        />
        <Button
          variant="primary"
          buttonSize="sm"
          onClick={applyUpdate}
          isLoading={isUpdating}
          loadingText="Updating…"
          text="Update"
        />
      </div>
    </div>
  );
};

export default UpdatePrompt;

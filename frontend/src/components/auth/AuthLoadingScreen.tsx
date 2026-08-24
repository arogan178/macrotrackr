import { useEffect, useState } from "react";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import StateCard from "@/components/ui/StateCard";
import { useIsOffline } from "@/hooks/useIsOffline";

/**
 * What a route guard shows while it still does not know who you are.
 *
 * A spinner is right for the first moment and wrong forever. Resolving a
 * session needs the network — Clerk downloads clerk-js and then asks the
 * Frontend API whose session this is — so a cold launch with no connection
 * leaves `isLoaded` false permanently: Clerk's loader gives up after its own
 * timeout and does not retry, and every guard sits on the spinner. The PWA
 * makes that easy to hit, because the precached shell means the app opens
 * offline and only then discovers it cannot get past the door.
 *
 * The threshold is a plain timeout rather than Clerk's `status`, so it also
 * covers self-hosted mode and says the one thing the person needs to know
 * regardless of which step hung.
 */
const AUTH_RESOLVE_TIMEOUT_MS = 10_000;

export function AuthLoadingScreen() {
  const isOffline = useIsOffline();
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasTimedOut(true), AUTH_RESOLVE_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, []);

  // Offline is knowable immediately; no reason to spin for ten seconds first.
  const hasGivenUp = isOffline || hasTimedOut;

  // Clerk's loader does not retry once it has failed, so the provider stays
  // stuck for the life of the document and only a fresh one recovers. Waiting
  // for the network beats asking someone to remember to pull to refresh.
  useEffect(() => {
    if (!hasGivenUp) return;

    const reload = () => globalThis.location.reload();

    globalThis.addEventListener("online", reload);

    return () => globalThis.removeEventListener("online", reload);
  }, [hasGivenUp]);

  if (!hasGivenUp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      {isOffline ? (
        <StateCard
          tone="offline"
          title="You're offline"
          message="Signing you in needs a connection. This will pick up on its own once you're back online."
          action={{ label: "Try again", onClick: () => globalThis.location.reload() }}
        />
      ) : (
        <StateCard
          tone="error"
          title="Couldn't confirm your session"
          message="We can't reach the sign-in service right now. Nothing has been lost — your data is still there."
          action={{ label: "Try again", onClick: () => globalThis.location.reload() }}
        />
      )}
    </div>
  );
}

export default AuthLoadingScreen;

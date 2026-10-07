import { useEffect } from "react";
import { useAuth, useClerk } from "@clerk/react";
import { useIsRestoring } from "@tanstack/react-query";

import { useIsOffline } from "@/hooks/useIsOffline";
import { isOfflineSession, startOfflineSession } from "@/lib/offlineSession";

import { useUser } from "./useAuthQueries.clerk";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

export function useAppAuthState(): AppAuthState {
  const { isLoaded, isSignedIn } = useAuth();
  const { status } = useClerk();
  const isOffline = useIsOffline();
  const isRestoring = useIsRestoring();
  const { data: cachedUser } = useUser({ enabled: false });

  // Clerk needs the network to load and never retries, so without one the
  // account last signed in on this device opens the app.
  const canOpenFromCache =
    !isLoaded && !isRestoring && Boolean(cachedUser) && (isOffline || status === "error");

  useEffect(() => {
    if (canOpenFromCache) startOfflineSession();
  }, [canOpenFromCache]);

  if (!isLoaded && (canOpenFromCache || isOfflineSession())) {
    return { isLoaded: true, isSignedIn: true };
  }

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
  };
}

import { useCallback, useEffect } from "react";
import { useAuth, useSession } from "@clerk/react";

import { apiClient } from "@/api/core";

export function ClerkTokenSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  const tokenGetter = useCallback(async () => {
    if (!isSignedIn || !getToken) {
      return null;
    }
    try {
      return await getToken();
    } catch {
      return null;
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      apiClient.setGetToken(tokenGetter);
    }
  }, [isLoaded, tokenGetter]);

  useEffect(() => {
    async function updateToken() {
      if (isSignedIn && session) {
        try {
          const token = await session.getToken();
          apiClient.setAuthToken(token);
        } catch {
          apiClient.setAuthToken(null);
        }
      } else {
        apiClient.setAuthToken(null);
      }
    }

    updateToken();
  }, [isSignedIn, session]);

  return null;
}

export default ClerkTokenSync;

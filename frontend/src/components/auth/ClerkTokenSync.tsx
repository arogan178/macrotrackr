import { useAuth, useSession } from "@clerk/clerk-react";
import { useCallback,useEffect } from "react";

import { setAuthToken,setGetToken } from "@/utils/apiServices";

export function ClerkTokenSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  const tokenGetter = useCallback(async () => {
    if (!isSignedIn || !getToken) {
      return null;
    }
    try {
      return await getToken();
    } catch (error) {
      console.error("Failed to get Clerk token:", error);
      return null;
    }
  }, [isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      setGetToken(tokenGetter);
    }
  }, [isLoaded, tokenGetter]);

  useEffect(() => {
    async function updateToken() {
      if (isSignedIn && session) {
        try {
          const token = await session.getToken();
          setAuthToken(token);
        } catch (error) {
          console.error("Failed to get session token:", error);
          setAuthToken(null);
        }
      } else {
        setAuthToken(null);
      }
    }

    updateToken();
  }, [isSignedIn, session]);

  return null;
}

export default ClerkTokenSync;

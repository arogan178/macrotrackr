import { useAuth, useSession } from "@clerk/clerk-react";
import { useCallback,useEffect } from "react";

import { setAuthToken,setGetToken } from "@/utils/apiServices";

/**
 * ClerkTokenSync - Component that syncs Clerk authentication tokens with the API service
 * 
 * This component should be mounted high in the app tree (inside ClerkProvider but before
 * any components that make API calls). It automatically:
 * 
 * 1. Sets up a token getter function that retrieves fresh Clerk tokens
 * 2. Updates the static token whenever the session changes
 * 3. Ensures all API calls include the proper Authorization header
 * 
 * Usage:
 * ```tsx
 * <ClerkProvider ...>
 *   <ClerkTokenSync />
 *   <RestOfYourApp />
 * </ClerkProvider>
 * ```
 */
export function ClerkTokenSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { session } = useSession();

  // Create a memoized token getter
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

  // Set up the token getter function for the API service
  useEffect(() => {
    if (isLoaded) {
      setGetToken(tokenGetter);
    }
  }, [isLoaded, tokenGetter]);

  // Update the static token when the session changes
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

  // This component doesn't render anything
  return null;
}

export default ClerkTokenSync;

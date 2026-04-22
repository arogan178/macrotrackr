import { useAuth } from "@clerk/clerk-react";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

export function useAppAuthState(): AppAuthState {
  const { isLoaded, isSignedIn } = useAuth();

  return {
    isLoaded,
    isSignedIn: Boolean(isSignedIn),
  };
}

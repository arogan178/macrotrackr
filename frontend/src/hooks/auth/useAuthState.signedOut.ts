import type { AppAuthState } from "./useAuthState.clerk";

/**
 * Used when ClerkProvider was deliberately not mounted. No session cookie was
 * present, so "signed out" is the answer rather than a guess.
 */
export function useAppAuthState(): AppAuthState {
  return { isLoaded: true, isSignedIn: false };
}

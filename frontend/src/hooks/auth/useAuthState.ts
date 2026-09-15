import { shouldMountClerk } from "@/config/clerkRuntime";
import { isClerkAuthMode } from "@/config/runtime";

import { useClerkAppAuthState } from "./clerkAuthRegistry";
import { useAppAuthState as useLocalAuthState } from "./useAuthState.local";
import { useAppAuthState as useSignedOutAuthState } from "./useAuthState.signedOut";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

const useSelectedAuthState = isClerkAuthMode
  ? shouldMountClerk
    ? useClerkAppAuthState
    : useSignedOutAuthState
  : useLocalAuthState;

export const useAppAuthState = useSelectedAuthState;

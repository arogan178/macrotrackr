import { shouldMountClerk } from "@/config/clerkRuntime";
import { isClerkAuthMode } from "@/config/runtime";

import { useAppAuthState as useClerkAuthState } from "./useAuthState.clerk";
import { useAppAuthState as useLocalAuthState } from "./useAuthState.local";
import { useAppAuthState as useSignedOutAuthState } from "./useAuthState.signedOut";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

const useSelectedAuthState = isClerkAuthMode
  ? shouldMountClerk
    ? useClerkAuthState
    : useSignedOutAuthState
  : useLocalAuthState;

export const useAppAuthState = useSelectedAuthState;

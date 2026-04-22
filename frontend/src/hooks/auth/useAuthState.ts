import { isClerkAuthMode } from "@/config/runtime";

import { useAppAuthState as useClerkAuthState } from "./useAuthState.clerk";
import { useAppAuthState as useLocalAuthState } from "./useAuthState.local";

export interface AppAuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
}

const useSelectedAuthState = isClerkAuthMode
  ? useClerkAuthState
  : useLocalAuthState;

export const useAppAuthState = useSelectedAuthState;

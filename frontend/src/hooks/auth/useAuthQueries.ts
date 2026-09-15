import { shouldMountClerk } from "@/config/clerkRuntime";
import { isClerkAuthMode } from "@/config/runtime";

import * as clerkHooks from "./useAuthQueries.clerk";
import * as localHooks from "./useAuthQueries.local";
import * as signedOutHooks from "./useAuthQueries.signedOut";

const selectedHooks = isClerkAuthMode
  ? shouldMountClerk
    ? clerkHooks
    : signedOutHooks
  : localHooks;

export const useUser = selectedHooks.useUser;
export const useLogout = selectedHooks.useLogout;
export const useResetPassword = selectedHooks.useResetPassword;
export const useChangePassword = selectedHooks.useChangePassword;

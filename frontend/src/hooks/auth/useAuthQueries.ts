import { isClerkAuthMode } from "@/config/runtime";

import * as clerkHooks from "./useAuthQueries.clerk";
import * as localHooks from "./useAuthQueries.local";

const selectedHooks = isClerkAuthMode ? clerkHooks : localHooks;

export const useUser = selectedHooks.useUser;
export const useLogout = selectedHooks.useLogout;
export const useResetPassword = selectedHooks.useResetPassword;
export const useChangePassword = selectedHooks.useChangePassword;

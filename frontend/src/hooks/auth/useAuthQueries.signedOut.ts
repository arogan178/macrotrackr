import { useMutation, useQuery } from "@tanstack/react-query";

import type { UserDetailsResponse } from "@/api/user";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

/**
 * Used when ClerkProvider was deliberately not mounted, which only happens on
 * public routes with no session cookie. The mutations below all live behind
 * /settings or /reset-password, which mount Clerk, so they are unreachable
 * here and say so rather than failing quietly.
 */
const unreachable =
  <TVariables,>(name: string) =>
  async (_variables: TVariables): Promise<never> => {
    throw new Error(`${name} requires Clerk, which this page did not mount.`);
  };

export function useUser(_options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async (): Promise<UserDetailsResponse | null> => null,
    ...queryConfigs.auth,
    retry: false,
    enabled: false,
  });
}

export function useLogout() {
  return useMutation({ mutationFn: unreachable<void>("useLogout") });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: unreachable<{ token: string; newPassword: string }>(
      "useResetPassword",
    ),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: unreachable<{ currentPassword: string; newPassword: string }>(
      "useChangePassword",
    ),
  });
}

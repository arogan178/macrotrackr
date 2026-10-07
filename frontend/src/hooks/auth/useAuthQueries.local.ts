import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { apiClient } from "@/api/core";
import { userApi, type UserDetailsResponse } from "@/api/user";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { clearBiometricCredentials } from "@/services/biometrics";
import { removeToken } from "@/utils/tokenStorage";

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export function useUser(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async (): Promise<UserDetailsResponse | null> => {
      try {
        return await userApi.getUserDetails();
      } catch (error) {
        if (error instanceof Error && hasStatus(error) && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    ...queryConfigs.auth,
    retry: false,
    enabled: options?.enabled ?? true,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const logLogoutError = createMutationErrorLogger("Logout failed");

  return useMutation({
    mutationFn: async (): Promise<void> => {
      removeToken();
      apiClient.setAuthToken(null);
      // Drop any opt-in biometric credentials from the KeyStore/Keychain
      await clearBiometricCredentials();
      try {
        await authApi.logout();
      } catch (error) {
        // 401: the server session is already gone, e.g. the account was just deleted.
        if (!(error instanceof Error && hasStatus(error) && error.status === 401)) {
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.clear();
      // Loaded on demand so the offline store stays off the first page load.
      void import("@/hooks/queries/macro/entryStore").then(({ clearSignedOutAccount }) =>
        clearSignedOutAccount(),
      );
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
      navigate({ to: "/" });
    },
    onError: logLogoutError,
  });
}

export function useChangePassword() {
  const logChangePasswordError = createMutationErrorLogger("Change password failed");

  return useMutation({
    mutationFn: async (data: ChangePasswordData): Promise<void> => {
      await authApi.changePassword(data);
    },
    onSuccess: () => {
      // Success notification handled by caller.
    },
    onError: logChangePasswordError,
  });
}

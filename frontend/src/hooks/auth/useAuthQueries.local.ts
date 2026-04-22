import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import { apiClient } from "@/api/core";
import { userApi, type UserDetailsResponse } from "@/api/user";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { removeToken } from "@/utils/tokenStorage";

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

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
      await authApi.logout();
    },
    onSuccess: () => {
      queryClient.clear();
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      queryClient.removeQueries({ queryKey: queryKeys.auth.session() });
      navigate({ to: "/" });
    },
    onError: logLogoutError,
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  const logResetPasswordError = createMutationErrorLogger("Password reset failed");

  return useMutation({
    mutationFn: async (data: ResetPasswordData): Promise<void> => {
      await authApi.resetPassword(data);
    },
    onSuccess: () => {
      navigate({ to: "/login", search: { returnTo: undefined } });
    },
    onError: logResetPasswordError,
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

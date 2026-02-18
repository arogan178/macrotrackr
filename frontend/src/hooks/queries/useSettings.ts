import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, UserDetailsResponse } from "@/utils/apiServices";

// Types for settings mutations
interface UserSettingsPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string | undefined;
  height?: number | undefined;
  weight?: number | undefined;
  gender?: "male" | "female" | undefined;
  activityLevel?: number | undefined;
}

/**
 * Query hook for fetching user settings
 */
export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.user(),
    queryFn: async (): Promise<UserDetailsResponse> => {
      return await apiService.user.getUserDetails();
    },
    ...queryConfigs.longLived, // 5 minutes stale time for settings
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message.includes("401")) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

/**
 * Mutation hook for saving user settings with optimistic updates
 */
export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.settings.user(), "save"],
    mutationFn: async (settings: UserSettingsPayload) => {
      return await apiService.user.updateSettings(settings);
    },
    onMutate: async (variables: UserSettingsPayload) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.settings.user() });
      await queryClient.cancelQueries({ queryKey: queryKeys.auth.user() });

      // Snapshot previous data
      const previousSettings = queryClient.getQueryData(
        queryKeys.settings.user(),
      );
      const previousAuthUser = queryClient.getQueryData(queryKeys.auth.user());

      // Optimistically update settings
      queryClient.setQueryData(queryKeys.settings.user(), (oldData: UserDetailsResponse | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...variables };
      });

      // Optimistically update auth user data
      queryClient.setQueryData(queryKeys.auth.user(), (oldData: UserDetailsResponse | undefined) => {
        if (!oldData) return oldData;
        return { ...oldData, ...variables };
      });

      return { previousSettings, previousAuthUser };
    },
    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousSettings !== undefined) {
        queryClient.setQueryData(
          queryKeys.settings.user(),
          context.previousSettings,
        );
      }
      if (context?.previousAuthUser !== undefined) {
        queryClient.setQueryData(
          queryKeys.auth.user(),
          context.previousAuthUser,
        );
      }
      console.error("Error saving settings:", error);
    },
    onSettled: () => {
      // Always refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.user(),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.user(),
      });
    },
    // Enhanced retry logic for settings
    retry: (failureCount, error) => {
      // Don't retry on validation errors (400, 422) or auth errors (401, 403)
      if (error instanceof Error && hasStatus(error)) {
        const status = error.status;
        if (
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 422
        ) {
          return false;
        }
      }
      // Retry network and server errors up to 3 times
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10_000),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
 * Mutation hook for saving user settings
 */
export function useSaveSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: UserSettingsPayload) => {
      return await apiService.user.updateSettings(settings);
    },
    onSuccess: () => {
      // Invalidate settings query to refetch fresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.settings.user(),
      });

      // Also invalidate auth user query since settings update affects user data
      queryClient.invalidateQueries({
        queryKey: queryKeys.auth.user(),
      });
    },
    retry: (failureCount, error) => {
      // Don't retry on validation errors (4xx)
      if (error instanceof Error && error.message.includes("4")) {
        return false;
      }
      return failureCount < 2;
    },
  });
}

import { useAuth, useClerk, useUser as useClerkUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { hasStatus, queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, setAuthToken, UserDetailsResponse } from "@/utils/apiServices";
import { removeToken } from "@/utils/tokenStorage";

interface ResetPasswordData {
  token: string;
  newPassword: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Query hook for current user data
 * Fetches user data from /api/auth/me (mapped to /api/user/me)
 * @param options - Optional configuration
 */
export function useUser(options?: { enabled?: boolean }) {
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async (): Promise<UserDetailsResponse | null> => {
      try {
        return await apiService.user.getUserDetails();
      } catch (error) {
        // If user is not authenticated, return null instead of throwing.
        // TanStack Query does not allow undefined query data.
        if (error instanceof Error && hasStatus(error) && error.status === 401) {
          return null;
        }
        throw error;
      }
    },
    ...queryConfigs.auth,
    retry: false, // Don't retry auth queries to avoid infinite loops
    // Only fetch user data once Clerk auth is loaded and a user is signed in.
    enabled: options?.enabled ?? (isLoaded && isSignedIn),
  });
}

/**
 * Mutation hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { signOut } = useClerk();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Remove token from storage
      removeToken();
      setAuthToken(null);

      // Sign out from Clerk to clear session cookies
      await signOut();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Also specifically invalidate auth queries to ensure they're cleared
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to landing page
      navigate({ to: "/" });
    },
  });
}

/**
 * Mutation hook for password reset
 */
export function useResetPassword() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: ResetPasswordData): Promise<void> => {
      await apiService.auth.resetPassword(data.token, data.newPassword);
    },
    onSuccess: () => {
      // Navigate to login with success message
      navigate({ to: "/login" });
    },
    onError: (error) => {
      console.error("Password reset failed:", error);
    },
  });
}

/**
 * Mutation hook for changing password (authenticated users)
 * Uses Clerk's API for password management
 */
export function useChangePassword() {
  const { user } = useClerkUser();

  return useMutation({
    mutationFn: async (data: ChangePasswordData): Promise<void> => {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Use Clerk's updatePassword method for password changes
      // This handles verification of current password and sets the new one
      await user.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      // Success notification will be handled by the component
    },
    onError: (error) => {
      console.error("Change password failed:", error);
    },
  });
}

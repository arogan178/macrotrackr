import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, UserDetailsResponse } from "@/utils/apiServices";
import { getToken, removeToken, setToken } from "@/utils/tokenStorage";

// Types for authentication mutations
interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  token: string;
  user?: UserDetailsResponse;
}

interface RegisterData extends Record<string, unknown> {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  gender?: string;
  activityLevel?: number;
}

interface RegisterResponse {
  token: string;
  user?: UserDetailsResponse;
}

interface ForgotPasswordData {
  email: string;
}

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
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async (): Promise<UserDetailsResponse | null> => {
      try {
        return await apiService.user.getUserDetails();
      } catch (error) {
        // If user is not authenticated, return null instead of throwing
        if (
          error instanceof Error &&
          "status" in error &&
          (error as any).status === 401
        ) {
          return null;
        }
        throw error;
      }
    },
    ...queryConfigs.auth,
    retry: false, // Don't retry auth queries to avoid infinite loops
    enabled: options?.enabled !== undefined ? options.enabled : !!getToken(),
  });
}

/**
 * Mutation hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (
      credentials: LoginCredentials,
    ): Promise<LoginResponse> => {
      const response = await apiService.auth.login(
        credentials.email,
        credentials.password,
      );

      // The API service should return a token, but the current implementation
      // might not be properly typed. We'll handle both cases.
      if (response && typeof response === "object" && "token" in response) {
        return response as LoginResponse;
      }

      // If no token in response, throw error
      throw new Error("Invalid login response - no token received");
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        setToken(data.token);
      }

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to home or intended route
      navigate({ to: "/home", search: { limit: 20, offset: 0 } });
    },
    onError: (error) => {
      console.error("Login failed:", error);
      // Error handling will be managed by the component
    },
  });
}

/**
 * Mutation hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Remove token from storage
      removeToken();

      // Note: The current API doesn't have a logout endpoint
      // but we'll clear local state regardless
      return;
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Also specifically invalidate auth queries to ensure they're cleared
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to login
      navigate({ to: "/login" });
    },
  });
}

/**
 * Mutation hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (userData: RegisterData): Promise<RegisterResponse> => {
      const response = await apiService.auth.register(userData);

      // Handle response similar to login
      if (response && typeof response === "object" && "token" in response) {
        return response as RegisterResponse;
      }

      throw new Error("Invalid registration response - no token received");
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        setToken(data.token);
      }

      // Invalidate and refetch user query
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to home
      navigate({ to: "/home", search: { limit: 20, offset: 0 } });
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
}

/**
 * Mutation hook for forgot password
 */
export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordData): Promise<void> => {
      await apiService.auth.forgotPassword(data.email);
    },
    onSuccess: () => {
      // Success notification will be handled by the component
    },
    onError: (error) => {
      console.error("Forgot password failed:", error);
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
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordData): Promise<void> => {
      await apiService.auth.changePassword(
        data.currentPassword,
        data.newPassword,
      );
    },
    onSuccess: () => {
      // Success notification will be handled by the component
    },
    onError: (error) => {
      console.error("Change password failed:", error);
    },
  });
}

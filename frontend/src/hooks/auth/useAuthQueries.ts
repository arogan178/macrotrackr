import { useAuth, useClerk, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService, setAuthToken, UserDetailsResponse } from "@/utils/apiServices";
import { removeToken, setToken } from "@/utils/tokenStorage";

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
  const { isLoaded, isSignedIn } = useAuth();

  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async (): Promise<UserDetailsResponse | null> => {
      try {
        return await apiService.user.getUserDetails();
      } catch (error) {
        // If user is not authenticated, return null instead of throwing.
        // TanStack Query does not allow undefined query data.
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
    // Only fetch user data once Clerk auth is loaded and a user is signed in.
    enabled: options?.enabled ?? (isLoaded && isSignedIn),
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
    onMutate: async () => {
      // Clear any existing auth data before login attempt
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      removeToken(); // Clear any stale token
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        setToken(data.token);
      }

      // Optimistically set user data if available
      if (data.user) {
        queryClient.setQueryData(queryKeys.auth.user(), data.user);
      }

      // Invalidate and refetch user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to intended route if provided via `returnTo` query param,
      // otherwise fall back to /home.
      try {
        const urlSearch = new URLSearchParams(globalThis.location.search || "");
        const returnTo = urlSearch.get("returnTo");
        if (returnTo) {
          navigate({ to: returnTo });
          return;
        }
      } catch {
        // ignore and fallback
      }

      navigate({ to: "/home", search: { limit: 20, offset: 0 } });
    },
    onError: (error, _variables, _context) => {
      // Ensure token is cleared on login failure
      removeToken();
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      console.error("Login failed:", error);
    },
    // Enhanced retry logic for login
    retry: (failureCount, error) => {
      // Don't retry on authentication errors (401, 403)
      if (error instanceof Error && "status" in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403 || status === 400) {
          return false;
        }
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
    onMutate: async () => {
      // Clear any existing auth data before registration attempt
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      removeToken(); // Clear any stale token
    },
    onSuccess: (data) => {
      // Store the token
      if (data.token) {
        setToken(data.token);
      }

      // Optimistically set user data if available
      if (data.user) {
        queryClient.setQueryData(queryKeys.auth.user(), data.user);
      }

      // Invalidate and refetch user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.user() });

      // Navigate to intended route if provided via `returnTo` query param,
      // otherwise fall back to /home.
      try {
        const urlSearch = new URLSearchParams(globalThis.location.search || "");
        const returnTo = urlSearch.get("returnTo");
        if (returnTo) {
          navigate({ to: returnTo });
          return;
        }
      } catch {
        // ignore and fallback
      }

      navigate({ to: "/home", search: { limit: 20, offset: 0 } });
    },
    onError: (error, _variables, _context) => {
      // Ensure token is cleared on registration failure
      removeToken();
      queryClient.removeQueries({ queryKey: queryKeys.auth.user() });
      console.error("Registration failed:", error);
    },
    // Enhanced retry logic for registration
    retry: (failureCount, error) => {
      // Don't retry on validation errors (400, 422) or conflicts (409)
      if (error instanceof Error && "status" in error) {
        const status = (error as any).status;
        if (status === 400 || status === 409 || status === 422) {
          return false;
        }
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
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
 * Uses Clerk's API for password management
 */
export function useChangePassword() {
  const { user } = useUser();

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

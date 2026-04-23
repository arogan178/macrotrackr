import { apiClient } from "@/api/core";

export interface AuthSyncResponse {
  user: unknown;
  isNewUser: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface LocalSessionResponse {
  authenticated: boolean;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

export const authApi = {
  register: async (payload: RegisterPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/register",
      payload,
    );
  },

  login: async (payload: LoginPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/login",
      payload,
    );
  },

  logout: async () => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/logout",
    );
  },

  logoutAll: async () => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/logout-all",
    );
  },

  getSession: async (): Promise<LocalSessionResponse> => {
    return apiClient.get<LocalSessionResponse>("/api/auth/session");
  },

  forgotPassword: async ({ email }: ForgotPasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/forgot-password",
      { email },
    );
  },

  /**
   * @throws {ApiError}
   */
  resetPassword: async ({ token, newPassword }: ResetPasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/reset-password",
      { token, newPassword }
    );
  },

  changePassword: async ({ currentPassword, newPassword }: ChangePasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/change-password",
      { currentPassword, newPassword },
    );
  },

  /**
   * @throws {ApiError}
   */
  syncUser: async ({ token }: { token?: string } = {}): Promise<AuthSyncResponse> => {
    if (token) {
      return apiClient.post<AuthSyncResponse>("/api/auth/clerk-sync", undefined, {
        customHeaders: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    }

    return apiClient.post<AuthSyncResponse>("/api/auth/clerk-sync");
  },
};

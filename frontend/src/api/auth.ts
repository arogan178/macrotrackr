import { apiClient } from "@/api/core";
import { removeToken, setToken } from "@/utils/tokenStorage";

export interface AuthSuccessResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
}

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
    removeToken();
    apiClient.setAuthToken(null);
    const res = await apiClient.post<AuthSuccessResponse>(
      "/api/auth/register",
      payload,
      { headers: { includeAuth: false } },
    );
    if (res.token) {
      setToken(res.token);
      apiClient.setAuthToken(res.token);
    }

    return res;
  },

  login: async (payload: LoginPayload) => {
    removeToken();
    apiClient.setAuthToken(null);
    const res = await apiClient.post<AuthSuccessResponse>(
      "/api/auth/login",
      payload,
      { headers: { includeAuth: false } },
    );
    if (res.token) {
      setToken(res.token);
      apiClient.setAuthToken(res.token);
    }

    return res;
  },

  logout: async () => {
    try {
      return await apiClient.post<{ success: boolean; message?: string }>(
        "/api/auth/logout",
      );
    } finally {
      removeToken();
      apiClient.setAuthToken(null);
    }
  },

  logoutAll: async () => {
    try {
      return await apiClient.post<{ success: boolean; message?: string }>(
        "/api/auth/logout-all",
      );
    } finally {
      removeToken();
      apiClient.setAuthToken(null);
    }
  },

  getSession: async (): Promise<LocalSessionResponse> => {
    return apiClient.get<LocalSessionResponse>("/api/auth/session");
  },

  forgotPassword: async ({ email }: ForgotPasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/forgot-password",
      { email },
      { headers: { includeAuth: false } },
    );
  },

  /**
   * @throws {ApiError}
   */
  resetPassword: async ({ token, newPassword }: ResetPasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/reset-password",
      { token, newPassword },
      { headers: { includeAuth: false } },
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

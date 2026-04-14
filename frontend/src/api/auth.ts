import { apiClient, type ApiError } from "@/api/core";

export interface AuthSyncResponse {
  user: unknown;
  isNewUser: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authApi = {
  /**
   * @throws {ApiError}
   */
  resetPassword: async ({ token, newPassword }: ResetPasswordPayload) => {
    return apiClient.post<{ success: boolean; message?: string }>(
      "/api/auth/reset-password",
      { token, newPassword }
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

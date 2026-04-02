import { API_BASE_URL, getHeaders, handleResponse } from "@/api/core";

export interface AuthSyncResponse {
  user: unknown;
  isNewUser: boolean;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authApi = {
  resetPassword: async ({ token, newPassword }: ResetPasswordPayload) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify({ token, newPassword }),
      credentials: "include",
    });

    return (await handleResponse(response)) as {
      success: boolean;
      message?: string;
    };
  },

  syncUser: async (token?: string): Promise<AuthSyncResponse> => {
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }
      : await getHeaders();
    const response = await fetch(`${API_BASE_URL}/api/auth/clerk-sync`, {
      method: "POST",
      headers,
      credentials: "include",
    });

    return (await handleResponse(response)) as AuthSyncResponse;
  },
};

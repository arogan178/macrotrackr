import { API_BASE_URL, getHeadersAsync, handleResponse } from "@/api/core";

export interface AuthSyncResponse {
  user: unknown;
  isNewUser: boolean;
}

export const authApi = {
  resetPassword: async (token: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: await getHeadersAsync(),
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
      : await getHeadersAsync();
    const response = await fetch(`${API_BASE_URL}/api/auth/clerk-sync`, {
      method: "POST",
      headers,
      credentials: "include",
    });
    return (await handleResponse(response)) as AuthSyncResponse;
  },
};

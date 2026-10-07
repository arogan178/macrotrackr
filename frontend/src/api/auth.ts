import { api, apiClient, unwrap } from "@/api/core";
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
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  /** True when this call inserted the row, so the profile is known to be empty. */
  isNewUser: boolean;
  message?: string;
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

// Replaces the default headers: the backend 404s login and register when any
// Authorization header is present.
const withoutAuthHeader = { fetch: { headers: {} } };

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthSuccessResponse> => {
    removeToken();
    apiClient.setAuthToken(null);
    const res = await unwrap(api.api.auth.register.post(payload, withoutAuthHeader));
    if (res.token) {
      setToken(res.token);
      apiClient.setAuthToken(res.token);
    }

    return res;
  },

  login: async (payload: LoginPayload): Promise<AuthSuccessResponse> => {
    removeToken();
    apiClient.setAuthToken(null);
    const res = await unwrap(api.api.auth.login.post(payload, withoutAuthHeader));
    if (res.token) {
      setToken(res.token);
      apiClient.setAuthToken(res.token);
    }

    return res;
  },

  logout: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      return await unwrap(api.api.auth.logout.post());
    } finally {
      removeToken();
      apiClient.setAuthToken(null);
    }
  },

  logoutAll: async (): Promise<{ success: boolean; message?: string }> => {
    try {
      return await unwrap(api.api.auth["logout-all"].post());
    } finally {
      removeToken();
      apiClient.setAuthToken(null);
    }
  },

  getSession: async (): Promise<LocalSessionResponse> =>
    unwrap(api.api.auth.session.get()),

  changePassword: async ({
    currentPassword,
    newPassword,
  }: ChangePasswordPayload): Promise<{ success: boolean; message?: string }> =>
    unwrap(api.api.auth["change-password"].post({ currentPassword, newPassword })),

  /**
   * @throws {ApiError}
   */
  syncUser: async ({ token }: { token?: string } = {}): Promise<AuthSyncResponse> =>
    unwrap(
      api.api.auth["clerk-sync"].post(
        undefined,
        token ? { headers: { authorization: `Bearer ${token}` } } : undefined,
      ),
    ),
};

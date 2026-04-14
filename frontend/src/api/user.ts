import { authApi } from "@/api/auth";
import { ApiError, apiClient } from "@/api/core";
import type { ActivityLevel } from "@/types/activity";
import { getActivityLevelFromString } from "@/utils/userConstants";

export interface UserDetailsResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  dateOfBirth?: string;
  height?: number;
  weight?: number;
  gender?: string;
  activityLevel?: number;
  isProfileComplete: boolean;
  subscription: {
    status: "free" | "pro" | "canceled";
    hasStripeCustomer: boolean;
    currentPeriodEnd: string | undefined;
  };
}

function isUserDetailsResponse(value: unknown): value is UserDetailsResponse {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.email === "string" &&
    typeof candidate.firstName === "string" &&
    typeof candidate.lastName === "string"
  );
}

function normalizeUserDetailsResponse(value: unknown): UserDetailsResponse | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidateRaw = value as Record<string, unknown>;

  const candidate: Record<string, unknown> = {
    ...candidateRaw,
    firstName: candidateRaw.firstName ?? candidateRaw.first_name,
    lastName: candidateRaw.lastName ?? candidateRaw.last_name,
    createdAt: candidateRaw.createdAt ?? candidateRaw.created_at,
    dateOfBirth: candidateRaw.dateOfBirth ?? candidateRaw.date_of_birth,
    activityLevel: candidateRaw.activityLevel ?? candidateRaw.activity_level,
  };

  if (!isUserDetailsResponse(candidate)) {
    return null;
  }

  return {
    id: candidate.id,
    email: candidate.email,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    createdAt:
      typeof candidate.createdAt === "string"
        ? candidate.createdAt
        : new Date().toISOString(),
    dateOfBirth:
      typeof candidate.dateOfBirth === "string" ? candidate.dateOfBirth : "",
    height: typeof candidate.height === "number" ? candidate.height : undefined,
    weight: typeof candidate.weight === "number" ? candidate.weight : undefined,
    gender: typeof candidate.gender === "string" ? candidate.gender : undefined,
    activityLevel:
      typeof candidate.activityLevel === "number"
        ? candidate.activityLevel
        : undefined,
    isProfileComplete:
      typeof candidate.isProfileComplete === "boolean"
        ? candidate.isProfileComplete
        : false,
    subscription:
      typeof candidate.subscription === "object"
        ? (candidate.subscription as UserDetailsResponse["subscription"])
        : { status: "free" as const, hasStripeCustomer: false, currentPeriodEnd: undefined },
  };
}

export type UserSettingsPayload = Partial<{
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: string;
  activityLevel: string | number;
}>;

export const userApi = {
  /**
   * @throws {ApiError}
   */
  getUserDetails: async (): Promise<UserDetailsResponse> => {
    const result = await apiClient.get<unknown>("/api/user/me");
    const normalizedResult = normalizeUserDetailsResponse(result);
    if (normalizedResult) {
      return normalizedResult;
    }

    throw new ApiError(
      "Invalid user profile response from server",
      500,
      "INVALID_USER_RESPONSE",
      result,
    );
  },

  /**
   * @throws {ApiError}
   */
  syncAndGetUserDetails: async ({ token }: { token?: string } = {}): Promise<UserDetailsResponse> => {
    await authApi.syncUser({ token });

    return userApi.getUserDetails();
  },

  /**
   * @throws {ApiError}
   */
  updateSettings: async (
    settings: UserSettingsPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const payloadToSend = { ...settings };
    if (
      payloadToSend.activityLevel !== undefined &&
      typeof payloadToSend.activityLevel === "string"
    ) {
      payloadToSend.activityLevel = getActivityLevelFromString(
        payloadToSend.activityLevel as ActivityLevel,
      );
    }

    const result = await apiClient.put<{
      success?: boolean;
      message?: string;
      data?: { success?: boolean; message?: string };
    }>("/api/user/settings", payloadToSend);

    return {
      success: result.data?.success ?? result.success ?? false,
      message: result.data?.message ?? result.message ?? "Settings updated.",
    };
  },

  /**
   * @throws {ApiError}
   */
  completeProfile: async (
    profileData: Partial<
      Pick<
        UserSettingsPayload,
        "dateOfBirth" | "height" | "weight" | "gender" | "activityLevel"
      >
    >,
  ): Promise<{ success: boolean; message: string }> => {
    const result = await apiClient.post<{
      success?: boolean;
      message?: string;
      data?: { success?: boolean; message?: string };
    }>("/api/user/complete-profile", profileData);

    return {
      success: result.data?.success ?? result.success ?? false,
      message:
        result.data?.message ?? result.message ?? "Profile updated successfully.",
    };
  },
};

import type {
  AnalyticsTrafficType,
  SwitchingSource,
} from "@shared/product-analytics";

import { authApi } from "@/api/auth";
import { api, ApiError, unwrap } from "@/api/core";
import type { ActivityLevel } from "@/types/activity";
import type { UnitSystem } from "@/utils/unitConversion";
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
  switchingSource?: SwitchingSource;
  unitSystem: UnitSystem;
  analyticsTrafficType: AnalyticsTrafficType;
  isProfileComplete: boolean;
  subscription: {
    status: "free" | "pro" | "canceled";
  };
}

export type UserSettingsPayload = Partial<{
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: "male" | "female";
  activityLevel: string | number;
  switchingSource: SwitchingSource;
  unitSystem: UnitSystem;
}>;

export const userApi = {
  /**
   * @throws {ApiError}
   */
  getUserDetails: async (): Promise<UserDetailsResponse> => {
    const user = await unwrap(api.api.user.me.get());
    // A misrouted API URL can answer 200 with the SPA's HTML instead of JSON.
    if (typeof user !== "object" || user === null) {
      throw new ApiError(
        "Invalid user profile response from server",
        500,
        "INVALID_USER_RESPONSE",
        user,
      );
    }

    return {
      ...user,
      dateOfBirth: user.dateOfBirth ?? "",
      height: user.height ?? undefined,
      weight: user.weight ?? undefined,
      gender: user.gender ?? undefined,
      activityLevel: user.activityLevel ?? undefined,
      switchingSource: user.switchingSource ?? undefined,
    };
  },

  /**
   * @throws {ApiError}
   */
  syncAndGetUserDetails: async ({
    token,
  }: { token?: string } = {}): Promise<UserDetailsResponse> => {
    await authApi.syncUser({ token });

    return userApi.getUserDetails();
  },

  /**
   * @throws {ApiError}
   */
  updateSettings: async (
    settings: UserSettingsPayload,
  ): Promise<{ success: boolean; message: string }> => {
    const { activityLevel, ...rest } = settings;

    return unwrap(
      api.api.user.settings.put({
        ...rest,
        activityLevel:
          typeof activityLevel === "string"
            ? getActivityLevelFromString(activityLevel as ActivityLevel)
            : activityLevel,
      }),
    );
  },

  /**
   * Permanently delete the current account and everything owned by it.
   * Irreversible. Rejects with 409 while a subscription is active.
   *
   * @throws {ApiError}
   */
  deleteAccount: async (): Promise<{ success: boolean; message: string }> =>
    unwrap(api.api.user.me.delete()),

  /**
   * @throws {ApiError}
   */
  completeProfile: async (
    profileData: Pick<
      UserSettingsPayload,
      | "dateOfBirth"
      | "height"
      | "weight"
      | "gender"
      | "switchingSource"
      | "unitSystem"
    > & { activityLevel?: number },
  ): Promise<{ success: boolean; message: string }> =>
    unwrap(api.api.user["complete-profile"].post(profileData)),
};

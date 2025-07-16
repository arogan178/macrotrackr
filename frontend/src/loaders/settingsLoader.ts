import { createUserSettings } from "@/features/settings/utils/calculations";
import { apiService } from "@/utils/apiServices";

// Valid genders for mapping backend string to Gender union
const validGenders = new Set(["male", "female"]);

// Route loader for user settings data
export async function settingsLoader() {
  try {
    const data = await apiService.user.getUserDetails();

    if (!data) {
      return {
        settings: undefined,
        error: "Failed to fetch settings data",
        authRequired: false,
      };
    }

    // Map gender to Gender union type if valid, else undefined
    const mappedGender = validGenders.has(data.gender as string)
      ? (data.gender as "male" | "female")
      : undefined;

    // Create settings object
    const settings = createUserSettings({
      ...data,
      gender: mappedGender,
      subscription: data.subscription,
    });

    return {
      settings,
      error: undefined,
      authRequired: false,
    };
  } catch (error) {
    console.error("Settings loader error:", error);

    // Check if it's an auth error
    if (error instanceof Error && error.message.includes("401")) {
      return {
        settings: undefined,
        error: undefined,
        authRequired: true,
      };
    }

    return {
      settings: undefined,
      error: error instanceof Error ? error.message : "Failed to load settings",
      authRequired: false,
    };
  }
}

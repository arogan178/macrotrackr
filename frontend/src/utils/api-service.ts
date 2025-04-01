/**
 * API Service - Centralizes API calls and standardizes error handling
 * Updated to align with the refactored backend API structure and error handling.
 */

// Assuming these imports exist and work as intended in your frontend structure
import { getActivityLevelFromString } from "@/features/settings/constants";
import { ActivityLevel } from "@/features/settings/types"; // Assuming Gender is 'male' | 'female'
import { getToken } from "./token-storage"; // Assuming this utility correctly retrieves the JWT

// API base URL - should be configured based on environment
const API_BASE_URL = "http://localhost:3000"; // Ensure this matches your backend port

// --- Interfaces for Payloads and Responses (align with backend Zod schemas - camelCase) ---

// Based on src/modules/auth/schemas.ts -> AuthSchemas.register
interface RegistrationDataPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string; // YYYY-MM-DD
  height: number;
  weight: number;
  gender: "male" | "female"; // Use specific literals
  activityLevel: number; // 1-5
}

// Based on src/modules/goals/schemas.ts -> GoalSchemas.updateWeightGoalBody
// Note: Backend schema uses camelCase
type WeightGoalPayload = {
  currentWeight: number | null;
  targetWeight: number | null;
  weightGoal: "lose" | "maintain" | "gain" | null;
  startDate: string | null; // YYYY-MM-DD
  targetDate: string | null; // YYYY-MM-DD
  adjustedCalorieIntake: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyDeficit: number | null;
};

// Based on src/modules/goals/schemas.ts -> GoalSchemas.updateMacroTargetBody
// Note: Backend schema uses camelCase
type MacroTargetPayload = {
  targetCalories: number | null;
  // Use consistent camelCase naming as defined in backend GoalSchemas
  macroTarget: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
  } | null;
};

// Based on src/modules/user/schemas.ts -> UserSchemas.userSettingsUpdate
// Using Partial as most fields are optional for update. Ensure keys are camelCase.
type UserSettingsPayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activityLevel: number | null;
  // Use consistent camelCase naming as defined in backend UserSchemas/GoalSchemas
  macroTarget: {
    // Changed from macroTarget
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
    // NOTE: locked_macros was defined in backend UserSchemas.macroTargetSettings
    // Add it here if the frontend needs to send it. Assuming it's part of the target object.
    lockedMacros?: Array<"protein" | "carbs" | "fats">; // Changed from locked_macros
  } | null;
}>;

// Based on src/modules/macros/schemas.ts -> MacroSchemas.macroEntryCreate
interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack"; // Changed from meal_type
  mealName?: string; // Changed from meal_name (optional already)
  entry_date: string; // YYYY-MM-DD
  entry_time: string; // HH:MM or HH:MM:SS
}

// Based on src/modules/macros/schemas.ts -> MacroSchemas.macroEntryUpdate
// Using Partial as updates allow modifying only some fields
type MacroEntryUpdatePayload = Partial<MacroEntryCreatePayload>;

// Structure for standardized API errors from the backend's onError handler
interface ApiErrorResponse {
  code: string; // e.g., "VALIDATION_ERROR", "AUTHENTICATION_ERROR", "NOT_FOUND"
  message: string;
  details?: any; // Optional field for more details (like validation errors)
}

// Custom Error class to hold structured API error info
class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// --- Helper Functions ---

/**
 * Handles API responses, parses JSON, and standardizes error handling.
 * Updated to handle valid null/empty responses for 200 OK status.
 */
async function handleResponse(response: Response): Promise<any> {
  // Handle successful responses (2xx status codes)
  if (response.ok) {
    // Handle specific 204 No Content responses
    if (response.status === 204) {
      return { success: true }; // Return a simple success indicator
    }

    // Try to parse successful JSON response, but handle potential null/empty body for 200 OK
    try {
      // Clone the response to read the text without consuming the body for json()
      // This prevents errors if the body is truly empty or just 'null' text
      const responseBodyText = await response.clone().text();
      if (!responseBodyText) {
        // If the body is empty, return null
        return null;
      }
      // If body is not empty, attempt to parse as JSON
      // This will correctly parse valid JSON including the value `null`
      return await response.json();
    } catch (e) {
      // If response.json() fails *even though status is OK*
      console.warn("API Success Response (2xx) could not be parsed as JSON:", {
        status: response.status,
        error: e,
      });
      // Assume a valid 'null' or empty response was intended for 200 OK status
      if (response.status === 200) {
        return null;
      }
      // For other 2xx statuses with unparsable bodies, it's unexpected
      throw new Error(
        "Received an invalid or unparsable response from the server."
      );
    }
  }

  // Handle error responses (response.ok is false - 4xx, 5xx status codes)
  let errorPayload: ApiErrorResponse | null = null;
  let errorMessage = `API error (${response.status}): ${response.statusText}`; // Default message includes status
  let errorCode = `HTTP_${response.status}`; // Default code
  let errorDetails: any = undefined;

  try {
    // Try to parse the error response body as JSON (expected format)
    errorPayload = await response.json();
    if (errorPayload && typeof errorPayload === "object") {
      // Use message and code from the backend's structured error response
      errorMessage = errorPayload.message || errorMessage;
      errorCode = errorPayload.code || errorCode;
      errorDetails = errorPayload.details;
    }
  } catch (e) {
    // Error response body wasn't valid JSON, stick to defaults based on statusText
    console.warn("API Error Response is not valid JSON:", e);
  }

  // Throw a custom ApiError containing structured information
  throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
}

/**
 * Generates headers for API calls, including Authorization if token exists.
 */
function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken(); // Use token-storage utility

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/**
 * Normalizes registration data from the frontend form to match the backend payload structure (camelCase).
 * Validation should happen primarily in the form before calling the API.
 */
function normalizeRegistrationData(userData: any): RegistrationDataPayload {
  // Ensure required fields are present (basic check, form should handle this)
  if (
    !userData.firstName ||
    !userData.lastName ||
    !userData.email ||
    !userData.password
  ) {
    throw new Error("Missing required registration fields.");
  }

  const normalized: Partial<RegistrationDataPayload> = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    dateOfBirth: userData.dateOfBirth, // Assuming YYYY-MM-DD string
    height: userData.height !== undefined ? Number(userData.height) : undefined,
    weight: userData.weight !== undefined ? Number(userData.weight) : undefined,
  };

  // Normalize gender to 'male' or 'female' string
  if (userData.gender !== undefined) {
    if (
      typeof userData.gender === "number" ||
      !isNaN(Number(userData.gender))
    ) {
      normalized.gender = Number(userData.gender) === 1 ? "male" : "female";
    } else if (typeof userData.gender === "string") {
      const lowerGender = userData.gender.toLowerCase();
      if (lowerGender === "male" || lowerGender === "female") {
        normalized.gender = lowerGender as "male" | "female";
      } else {
        throw new Error("Invalid gender value provided.");
      }
    } else {
      throw new Error("Invalid gender value provided.");
    }
  } else {
    throw new Error("Gender is required for registration.");
  }

  // Normalize activityLevel to number 1-5
  if (userData.activityLevel !== undefined) {
    let level: number | undefined = undefined;
    if (
      typeof userData.activityLevel === "number" ||
      !isNaN(Number(userData.activityLevel))
    ) {
      level = Number(userData.activityLevel);
    } else if (typeof userData.activityLevel === "string") {
      level = getActivityLevelFromString(
        userData.activityLevel as ActivityLevel
      );
    }

    if (level !== undefined && level >= 1 && level <= 5) {
      normalized.activityLevel = level;
    } else {
      throw new Error(
        "Invalid or out-of-range activity level provided (must be 1-5)."
      );
    }
  } else {
    throw new Error("Activity Level is required for registration.");
  }

  // Ensure all required fields for the backend payload are present after normalization
  if (
    !normalized.dateOfBirth ||
    normalized.height === undefined ||
    normalized.weight === undefined ||
    !normalized.gender ||
    !normalized.activityLevel
  ) {
    throw new Error("Missing required profile details for registration.");
  }

  return normalized as RegistrationDataPayload; // Cast to the final type
}

/**
 * Normalizes settings data before sending to the backend.
 * Ensures activityLevel is a number (1-5).
 * Assumes input 'settings' object uses camelCase keys matching UserSettingsPayload.
 */
function normalizeSettingsData(
  settings: UserSettingsPayload
): UserSettingsPayload {
  // Create a copy to avoid modifying the original object, ensure only valid keys are passed
  const normalizedSettings: UserSettingsPayload = {};

  // Copy/normalize known fields from UserSettingsPayload definition
  if (settings.firstName !== undefined)
    normalizedSettings.firstName = settings.firstName;
  if (settings.lastName !== undefined)
    normalizedSettings.lastName = settings.lastName;
  if (settings.email !== undefined) normalizedSettings.email = settings.email;
  if (settings.dateOfBirth !== undefined)
    normalizedSettings.dateOfBirth = settings.dateOfBirth; // Allow null
  if (settings.height !== undefined)
    normalizedSettings.height =
      settings.height !== null ? Number(settings.height) : null; // Allow null
  if (settings.weight !== undefined)
    normalizedSettings.weight =
      settings.weight !== null ? Number(settings.weight) : null; // Allow null
  if (settings.gender !== undefined)
    normalizedSettings.gender = settings.gender; // Allow null
  if (settings.macroTarget !== undefined)
    normalizedSettings.macroTarget = settings.macroTarget; // Allow null

  // Normalize activityLevel if present in the update payload
  if (settings.activityLevel !== undefined && settings.activityLevel !== null) {
    let level: number | undefined = undefined;
    if (
      typeof settings.activityLevel === "number" ||
      !isNaN(Number(settings.activityLevel))
    ) {
      level = Number(settings.activityLevel);
    } else if (typeof settings.activityLevel === "string") {
      level = getActivityLevelFromString(
        settings.activityLevel as ActivityLevel
      );
    }

    if (level !== undefined && level >= 1 && level <= 5) {
      normalizedSettings.activityLevel = level;
    } else {
      throw new Error(
        "Invalid or out-of-range activity level provided (must be 1-5)."
      );
    }
  } else if (settings.activityLevel === null) {
    normalizedSettings.activityLevel = null; // Explicitly allow setting to null
  }

  // Add normalization for macroTarget percentages if needed (e.g., ensure integers)
  if (normalizedSettings.macroTarget) {
    normalizedSettings.macroTarget.proteinPercentage = Math.round(
      normalizedSettings.macroTarget.proteinPercentage
    );
    normalizedSettings.macroTarget.carbsPercentage = Math.round(
      normalizedSettings.macroTarget.carbsPercentage
    );
    normalizedSettings.macroTarget.fatsPercentage = Math.round(
      normalizedSettings.macroTarget.fatsPercentage
    );
    // Ensure sum is 100? Backend validator handles this.
  }

  return normalizedSettings;
}

/**
 * Centralized API service object with methods grouped by resource.
 */
export const apiService = {
  // User endpoints
  user: {
    /** Fetches the current authenticated user's profile */
    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    /** Updates user settings */
    updateSettings: async (settings: UserSettingsPayload) => {
      // Normalize ensures correct types and potentially maps keys if needed
      const normalizedSettings = normalizeSettingsData(settings);
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(normalizedSettings), // Send camelCase payload
      });
      return handleResponse(response);
    },

    /** Completes user profile (assuming payload matches ProfileCompletion schema) */
    completeProfile: async (profileData: {
      dateOfBirth?: string | null;
      height?: number | null;
      weight?: number | null;
      activityLevel?: number | null;
    }) => {
      // Add normalization if needed, similar to normalizeSettingsData
      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(profileData), // Send camelCase payload
        }
      );
      return handleResponse(response);
    },
  },

  // Authentication endpoints
  auth: {
    /** Logs in a user */
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },

    /** Registers a new user */
    register: async (userData: any) => {
      try {
        const normalizedData = normalizeRegistrationData(userData);
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(normalizedData), // Send camelCase payload
        });
        return handleResponse(response);
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        } else if (error instanceof Error) {
          throw new ApiError(error.message, 400, "VALIDATION_ERROR");
        }
        throw error;
      }
    },

    /** Checks if an email is already registered */
    validateEmail: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return handleResponse(response);
    },
  },

  // Macro entry endpoints
  macros: {
    /** Gets the sum of macros consumed today */
    getDailyTotals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/today`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    /** Gets all macro entries for the user */
    getHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/history`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    /** Adds a new macro entry */
    addEntry: async (entry: MacroEntryCreatePayload) => {
      // Ensure payload keys are camelCase as per interface
      const payload = {
        ...entry,
        mealType: entry.mealType, // Ensure camelCase if input was different
        mealName: entry.mealName,
      };
      const response = await fetch(`${API_BASE_URL}/api/macros`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload), // Send camelCase payload
      });
      return handleResponse(response);
    },

    /** Updates an existing macro entry */
    updateEntry: async (id: number, entry: MacroEntryUpdatePayload) => {
      // Ensure payload keys are camelCase as per interface
      const payload: MacroEntryUpdatePayload = {};
      if (entry.protein !== undefined) payload.protein = entry.protein;
      if (entry.carbs !== undefined) payload.carbs = entry.carbs;
      if (entry.fats !== undefined) payload.fats = entry.fats;
      if (entry.mealType !== undefined) payload.mealType = entry.mealType; // camelCase
      if (entry.mealName !== undefined) payload.mealName = entry.mealName; // camelCase
      if (entry.entry_date !== undefined) payload.entry_date = entry.entry_date;
      if (entry.entry_time !== undefined) payload.entry_time = entry.entry_time;

      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload), // Send camelCase payload
      });
      return handleResponse(response);
    },

    /** Deletes a specific macro entry */
    deleteEntry: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
  },

  // Goals endpoints
  goals: {
    /** Gets weight goals from the API */
    getWeightGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        headers: getHeaders(false), // Use getHeaders(false) for GET
      });
      // handleResponse now correctly returns null for 200 OK with empty/null body
      // The check for 404 is now redundant if the backend returns null on 404 via the schema.
      // However, keeping it doesn't hurt if the backend might return 404 directly sometimes.
      // Let's rely on handleResponse for consistency.
      // if (response.status === 404) { return null; } // Can likely remove this line
      return handleResponse(response);
    },

    /** Saves weight goals to the API */
    saveWeightGoals: async (weightGoals: WeightGoalPayload) => {
      // Added specific type
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(weightGoals), // Send camelCase payload
      });
      return handleResponse(response);
    },

    /** Gets macro target from the API */
    getMacroTarget: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/macros`, {
        headers: getHeaders(false), // Use getHeaders(false) for GET
      });
      // Rely on handleResponse for null/empty 200 OK
      // if (response.status === 404) { return null; } // Can likely remove this line
      return handleResponse(response);
    },

    /** Saves macro target to the API */
    saveMacroTarget: async (macroTarget: MacroTargetPayload) => {
      // Added specific type, use macroTarget naming
      // Ensure payload uses camelCase 'macroTarget' key
      const payload = {
        targetCalories: macroTarget.targetCalories,
        macroTarget: macroTarget.macroTarget,
      };
      const response = await fetch(`${API_BASE_URL}/api/goals/macros`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload), // Send camelCase payload
      });
      return handleResponse(response);
    },

    /** Resets all goals */
    resetGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/reset`, {
        method: "POST",
        headers: getHeaders(false), // No body, so no Content-Type needed
      });
      return handleResponse(response);
    },
  },
};

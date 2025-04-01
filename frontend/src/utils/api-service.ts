/**
 * API Service - Centralizes API calls and standardizes error handling
 * Updated to align with the refactored backend API structure and error handling.
 */

// Assuming these imports exist and work as intended in your frontend structure
import { getActivityLevelFromString } from "@/features/settings/constants";
import { Gender, ActivityLevel } from "@/features/settings/types";
import { getToken } from "./token-storage"; // Assuming this utility correctly retrieves the JWT

// API base URL - should be configured based on environment
const API_BASE_URL = "http://localhost:3000"; // Ensure this matches your backend port

// --- Interfaces for Payloads and Responses (align with backend Zod schemas) ---

// Based on src/modules/auth/schemas.ts -> AuthSchemas.register
interface RegistrationDataPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string; // YYYY-MM-DD
  height: number;
  weight: number;
  gender: Gender;
  activityLevel: number; // 1-5
}

// Based on src/modules/user/schemas.ts -> UserSchemas.userSettingsUpdate
// Using Partial as most fields are optional for update
type UserSettingsPayload = Partial<{
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null; // YYYY-MM-DD or null
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activity_level: number | null; // 1-5 or null
  macro_target: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
    locked_macros: Array<"protein" | "carbs" | "fats">;
  } | null;
}>;

// Based on src/modules/macros/schemas.ts -> MacroSchemas.macroEntryCreate
interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  meal_name?: string; // Optional
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
 * Updated to parse the new backend error structure.
 */
async function handleResponse(response: Response): Promise<any> {
  // Handle successful responses
  if (response.ok) {
    // Handle No Content responses (e.g., successful DELETE)
    if (response.status === 204) {
      return { success: true }; // Return a simple success indicator
    }
    // Try to parse successful JSON response
    try {
      const data = await response.json();
      // Explicitly return null if the backend returns null
      // This ensures null is handled as a valid response, not an error
      return data;
    } catch (e) {
      // Handle cases where response is OK but not valid JSON (shouldn't happen often with APIs)
      console.error("API Success Response is not valid JSON:", e);
      throw new Error("Received an invalid response from the server.");
    }
  }

  // Handle error responses (response.ok is false)
  let errorPayload: ApiErrorResponse | null = null;
  let errorMessage = `API error: ${response.statusText}`; // Default message
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
 * Normalizes registration data from the frontend form to match the backend payload structure.
 * Validation should happen primarily in the form before calling the API.
 */
function normalizeRegistrationData(userData: any): RegistrationDataPayload {
  // Backend expects: firstName, lastName, email, password, dateOfBirth (string),
  // height (number), weight (number), gender ('male'|'female'), activityLevel (number 1-5)

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
    // Ensure date format if provided (form validation preferred)
    dateOfBirth: userData.dateOfBirth, // Assuming it's already YYYY-MM-DD string
    // Ensure numbers if provided (form validation preferred)
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
    throw new Error("Gender is required for registration."); // Example: Make gender required
  }

  // Normalize activityLevel to number 1-5
  if (userData.activityLevel !== undefined) {
    if (
      typeof userData.activityLevel === "number" ||
      !isNaN(Number(userData.activityLevel))
    ) {
      const level = Number(userData.activityLevel);
      if (level >= 1 && level <= 5) {
        normalized.activityLevel = level;
      } else {
        throw new Error("Activity level must be between 1 and 5.");
      }
    } else if (typeof userData.activityLevel === "string") {
      // Use the imported helper function if it converts string ("sedentary") to number (1)
      normalized.activityLevel = getActivityLevelFromString(
        userData.activityLevel as ActivityLevel
      );
      if (normalized.activityLevel < 1 || normalized.activityLevel > 5) {
        throw new Error("Invalid activity level string provided.");
      }
    } else {
      throw new Error("Invalid activity level value provided.");
    }
  } else {
    throw new Error("Activity Level is required for registration."); // Example: Make activity level required
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
 * Ensures activity_level is a number (1-5).
 */
function normalizeSettingsData(settings: any): UserSettingsPayload {
  const normalizedSettings: UserSettingsPayload = { ...settings };

  // Normalize activity_level if present in the update payload
  if (
    normalizedSettings.activity_level !== undefined &&
    normalizedSettings.activity_level !== null
  ) {
    if (
      typeof normalizedSettings.activity_level === "number" ||
      !isNaN(Number(normalizedSettings.activity_level))
    ) {
      const level = Number(normalizedSettings.activity_level);
      if (level >= 1 && level <= 5) {
        normalizedSettings.activity_level = level;
      } else {
        throw new Error("Activity level must be between 1 and 5.");
      }
    } else if (typeof normalizedSettings.activity_level === "string") {
      normalizedSettings.activity_level = getActivityLevelFromString(
        normalizedSettings.activity_level as ActivityLevel
      );
      if (
        normalizedSettings.activity_level < 1 ||
        normalizedSettings.activity_level > 5
      ) {
        throw new Error("Invalid activity level string provided.");
      }
    } else {
      throw new Error("Invalid activity level value provided.");
    }
  }

  // Note: Backend uses snake_case (e.g., first_name), ensure payload keys match
  // If frontend uses camelCase (e.g., firstName), map them here or ensure consistency
  // Example mapping (if needed):
  // if (settings.firstName !== undefined) normalizedSettings.first_name = settings.firstName;
  // if (settings.lastName !== undefined) normalizedSettings.last_name = settings.lastName;
  // etc.
  // Assuming for now that the 'settings' object passed in already uses snake_case keys matching the backend.

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
        headers: getHeaders(false), // No Content-Type needed for GET
      });
      return handleResponse(response); // Returns parsed profile data or throws ApiError
    },

    /** Updates user settings */
    updateSettings: async (settings: UserSettingsPayload) => {
      const normalizedSettings = normalizeSettingsData(settings);
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(normalizedSettings),
      });
      return handleResponse(response); // Returns { success: true } or throws ApiError
    },

    /** Completes user profile */
    completeProfile: async (profileData: any) => {
      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(profileData),
        }
      );
      return handleResponse(response); // Returns { success: true } or throws ApiError
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
      // Returns { token: "..." } or throws ApiError
      return handleResponse(response);
    },

    /** Registers a new user */
    register: async (userData: any) => {
      // Accept raw form data
      try {
        // Normalize data to the specific payload format expected by the backend
        const normalizedData = normalizeRegistrationData(userData);

        const response = await fetch(
          `${API_BASE_URL}/api/auth/register`, // *** UPDATED PATH ***
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(normalizedData),
          }
        );
        // Returns { token: "..." } or throws ApiError
        return handleResponse(response);
      } catch (error) {
        // Catch normalization errors or re-throw API errors
        if (error instanceof ApiError) {
          throw error; // Re-throw ApiError from handleResponse
        } else if (error instanceof Error) {
          // Throw as a generic client-side validation/normalization error
          // Wrap it in ApiError for consistency if desired, or handle differently
          throw new ApiError(error.message, 400, "VALIDATION_ERROR"); // Example
        }
        throw error; // Re-throw unknown errors
      }
    },

    /** Checks if an email is already registered */
    validateEmail: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      // Returns { valid: true } or throws ApiError (e.g., 409 Conflict)
      return handleResponse(response);
    },
  },

  // Macro entry endpoints
  macros: {
    /** Gets the sum of macros consumed today */
    getDailyTotals: async () => {
      const response = await fetch(
        `${API_BASE_URL}/api/macros/today`, // *** UPDATED PATH ***
        {
          headers: getHeaders(false),
        }
      );
      // Returns { protein, carbs, fats, calories } or throws ApiError
      return handleResponse(response);
    },

    /** Gets all macro entries for the user */
    getHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/history`, {
        headers: getHeaders(false),
      });
      // Returns array of macro entries or throws ApiError
      return handleResponse(response);
    },

    /** Adds a new macro entry */
    addEntry: async (entry: MacroEntryCreatePayload) => {
      // *** UPDATED SIGNATURE ***
      // Ensure payload matches backend schema requirements
      const response = await fetch(
        `${API_BASE_URL}/api/macros`, // *** UPDATED PATH ***
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(entry), // Send the full entry object
        }
      );
      // Returns the newly created macro entry object or throws ApiError
      return handleResponse(response);
    },

    /** Updates an existing macro entry */
    updateEntry: async (id: number, entry: MacroEntryUpdatePayload) => {
      // *** UPDATED SIGNATURE ***
      const response = await fetch(
        `${API_BASE_URL}/api/macros/${id}`, // *** UPDATED PATH ***
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(entry), // Send partial or full update data
        }
      );
      // Returns the updated macro entry object or throws ApiError
      return handleResponse(response);
    },

    /** Deletes a specific macro entry */
    deleteEntry: async (id: number) => {
      const response = await fetch(
        `${API_BASE_URL}/api/macros/${id}`, // *** UPDATED PATH ***
        {
          method: "DELETE",
          headers: getHeaders(false), // No Content-Type needed for DELETE
        }
      );
      // Returns { success: true } or throws ApiError
      return handleResponse(response);
    },
  },

  // Goals endpoints
  goals: {
    /** Gets weight goals from the API */
    getWeightGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        headers: getHeaders(),
      });
      // If not found (404), return null instead of throwing an error
      if (response.status === 404) {
        return null;
      }
      return handleResponse(response);
    },

    /** Saves weight goals to the API */
    saveWeightGoals: async (weightGoals: any) => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(weightGoals),
      });
      return handleResponse(response);
    },

    /** Gets macro target from the API */
    getMacroTarget: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/macros`, {
        headers: getHeaders(),
      });
      // If not found (404), return null instead of throwing an error
      if (response.status === 404) {
        return null;
      }
      return handleResponse(response);
    },

    /** Saves macro target to the API */
    saveMacroTarget: async (macroTarget: any) => {
      const response = await fetch(`${API_BASE_URL}/api/goals/macros`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(macroTarget),
      });
      return handleResponse(response);
    },

    /** Resets all goals */
    resetGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/reset`, {
        method: "POST",
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
  },
};

// Example usage (in your components/hooks):
/*
async function handleLogin(email, password) {
  try {
    const data = await apiService.auth.login(email, password);
    saveToken(data.token); // Assuming saveToken exists
    // Redirect user or update UI state
  } catch (error) {
    if (error instanceof ApiError) {
      console.error(`API Error (${error.status} - ${error.code}): ${error.message}`);
      // Display specific error message to user based on error.code or error.status
      if (error.status === 401) {
        // Show "Invalid credentials" message
      } else {
        // Show generic error message
      }
    } else {
      console.error("An unexpected error occurred:", error);
      // Show generic error message
    }
  }
}
*/

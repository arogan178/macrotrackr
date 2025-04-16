/**
 * API Service - Centralizes API calls and standardizes error handling
 * Updated for simplified calorie target model and refactored goal/macro endpoints.
 */

// Assuming these imports exist and work as intended in your frontend structure
import { getActivityLevelFromString } from "@/features/settings/constants"; // Adjust path as needed
import { ActivityLevel } from "@/features/settings/types"; // Adjust path as needed
import { getToken } from "./token-storage"; // Adjust path as needed
import { WeightGoalFormValues } from "@/features/goals/types";
import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal
} from "@/features/goals/calculations";

// API Base URL and Response Types
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- Interfaces for Payloads and Responses (camelCase) ---

interface RegistrationDataPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: "male" | "female";
  activityLevel: number;
}

// Payload for PUT /api/goals/weight (CREATE)
type SetWeightGoalPayload = {
  startingWeight: number; // Required for creation
  targetWeight: number | null;
  weightGoal: "lose" | "maintain" | "gain" | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
};

// Payload for PUT /api/goals/weight (UPDATE)
// Omits startingWeight
type UpdateWeightGoalPayload = Omit<SetWeightGoalPayload, "startingWeight">;

// --- Weight Log Interfaces ---
export interface WeightLogEntry {
  id: string;
  timestamp: string; // ISO 8601 string
  weight: number;
}

export interface AddWeightLogPayload {
  timestamp: string; // ISO 8601 string
  weight: number;
}
// --- END Weight Log Interfaces ---

// Type for the macro target percentages object
type MacroTargetPercentagesObject = {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros?: Array<"protein" | "carbs" | "fats">;
} | null;

// Payload for PUT /api/macros/target (updating percentages ONLY)
type MacroTargetPercentagesPayload = {
  macroTarget: MacroTargetPercentagesObject;
};

// Type for response from GET /api/macros/target (percentages ONLY)
type MacroTargetGetResponse = {
  macroTarget: MacroTargetPercentagesObject;
} | null;

// Payload for PUT /api/user/settings (User details ONLY)
// macroTarget removed
type UserSettingsPayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | null;
  height: number | null;
  weight: number | null;
  gender: "male" | "female" | null;
  activityLevel: number | null;
}>;

interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack"; // camelCase
  mealName?: string; // camelCase
  entry_date: string;
  entry_time: string;
}
type MacroEntryUpdatePayload = Partial<MacroEntryCreatePayload>;
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: any;
}
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

// Habit Goal Payload
type HabitGoalPayload = {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?: "indigo" | "blue" | "green" | "purple";
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
};

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
      const responseBodyText = await response.clone().text();
      if (!responseBodyText) {
        return null;
      } // Return null if body is empty
      return await response.json(); // Parse JSON if body exists
    } catch (e) {
      console.warn("API Success Response (2xx) could not be parsed as JSON:", {
        status: response.status,
        error: e,
      });
      if (response.status === 200) {
        return null;
      } // Assume valid null/empty for 200
      throw new Error(
        "Received an invalid or unparsable response from the server."
      );
    }
  }

  // Handle error responses (response.ok is false - 4xx, 5xx status codes)
  let errorPayload: ApiErrorResponse | null = null;
  let errorMessage = `API error (${response.status}): ${response.statusText}`;
  let errorCode = `HTTP_${response.status}`;
  let errorDetails: any = undefined;
  try {
    errorPayload = await response.json();
    if (errorPayload && typeof errorPayload === "object") {
      errorMessage = errorPayload.message || errorMessage;
      errorCode = errorPayload.code || errorCode;
      errorDetails = errorPayload.details;
    }
  } catch (e) {
    console.warn("API Error Response is not valid JSON:", e);
  }
  throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
}

function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function normalizeRegistrationData(userData: any): RegistrationDataPayload {
  // Basic validation
  if (
    !userData.firstName ||
    !userData.lastName ||
    !userData.email ||
    !userData.password
  ) {
    throw new Error("Missing required registration fields.");
  }
  // Normalize/validate other fields...
  const normalized: Partial<RegistrationDataPayload> = {
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    password: userData.password,
    dateOfBirth: userData.dateOfBirth,
    height: userData.height !== undefined ? Number(userData.height) : undefined,
    weight: userData.weight !== undefined ? Number(userData.weight) : undefined,
  };
  // Gender normalization
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
  // Activity Level normalization
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
  // Final check
  if (
    !normalized.dateOfBirth ||
    normalized.height === undefined ||
    normalized.weight === undefined ||
    !normalized.gender ||
    !normalized.activityLevel
  ) {
    throw new Error("Missing required profile details for registration.");
  }
  return normalized as RegistrationDataPayload;
}

// Removed normalizeSettingsData as it's no longer needed after simplifying UserSettingsPayload
// Add back if complex normalization is needed for user fields (e.g., activityLevel string -> number)

/**
 * Centralized API service object with methods grouped by resource.
 */
export const apiService = {
  // User endpoints
  user: {
    /** Fetches the current authenticated user's profile */
    getUserDetails: async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    /** Updates user settings (profile details only) */
    updateSettings: async (settings: UserSettingsPayload) => {
      // Basic normalization (e.g., ensure activityLevel is number if sent as string)
      const payloadToSend = { ...settings };
      if (
        payloadToSend.activityLevel !== undefined &&
        payloadToSend.activityLevel !== null &&
        typeof payloadToSend.activityLevel === "string"
      ) {
        payloadToSend.activityLevel = getActivityLevelFromString(
          payloadToSend.activityLevel as ActivityLevel
        );
      }
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payloadToSend), // Send payload with only user details
      });
      return handleResponse(response);
    },
    /** Completes user profile */
    completeProfile: async (
      profileData: Partial<
        Pick<
          UserSettingsPayload,
          "dateOfBirth" | "height" | "weight" | "activityLevel"
        >
      >
    ) => {
      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(profileData),
        }
      );
      return handleResponse(response);
    },
  },

  // Authentication endpoints
  auth: {
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(response);
    },
    register: async (userData: any) => {
      try {
        const normalizedData = normalizeRegistrationData(userData);
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(normalizedData),
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
    getDailyTotals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/today`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    getHistory: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macros/history`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    addEntry: async (entry: MacroEntryCreatePayload) => {
      const payload = {
        ...entry,
        mealType: entry.mealType,
        mealName: entry.mealName,
      };
      const response = await fetch(`${API_BASE_URL}/api/macros`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    updateEntry: async (id: number, entry: MacroEntryUpdatePayload) => {
      const payload: MacroEntryUpdatePayload = {};
      if (entry.protein !== undefined) payload.protein = entry.protein;
      if (entry.carbs !== undefined) payload.carbs = entry.carbs;
      if (entry.fats !== undefined) payload.fats = entry.fats;
      if (entry.mealType !== undefined) payload.mealType = entry.mealType;
      if (entry.mealName !== undefined) payload.mealName = entry.mealName;
      if (entry.entry_date !== undefined) payload.entry_date = entry.entry_date;
      if (entry.entry_time !== undefined) payload.entry_time = entry.entry_time;
      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    deleteEntry: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    /** Gets ONLY macro target percentages object */
    getMacroTarget: async (): Promise<MacroTargetGetResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/macros/target`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    /** Saves ONLY macro target percentages */
    saveMacroTargetPercentages: async (
      payload: MacroTargetPercentagesPayload
    ) => {
      if (!payload || payload.macroTarget === undefined) {
        throw new Error("Invalid payload: macroTarget object is required.");
      }
      const response = await fetch(`${API_BASE_URL}/api/macros/target`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ macroTarget: payload.macroTarget }),
      });
      return handleResponse(response);
    },
  },

  // Goals endpoints
  goals: {
    /** Gets weight goals (including calorieTarget) */
    getWeightGoals: async (): Promise<SetWeightGoalPayload | null> => {
      // Return type might need adjustment based on backend response
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
    /** Creates new weight goals */
    createWeightGoal: async (goals: WeightGoalFormValues, tdee: number) => {
      // Calculate the complete goal data including calorie targets
      const payload = {
        ...goals,
        calorieTarget: goals.calorieTarget ?? calculateCalorieTarget(tdee, goals.startingWeight, goals.targetWeight ?? goals.startingWeight),
        weeklyChange: goals.weeklyChange ?? calculateWeeklyChange(goals.startingWeight, goals.targetWeight ?? goals.startingWeight),
        calculatedWeeks: goals.calculatedWeeks ?? calculateWeeksToGoal(goals.startingWeight, goals.targetWeight ?? goals.startingWeight)
      };

      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },

    /** Updates existing weight goals */
    updateWeightGoal: async (goals: WeightGoalFormValues, tdee: number) => {
      // Calculate the complete goal data including calorie targets
      const payload = {
        ...goals,
        calorieTarget: goals.calorieTarget ?? calculateCalorieTarget(tdee, goals.startingWeight, goals.targetWeight ?? goals.startingWeight),
        weeklyChange: goals.weeklyChange ?? calculateWeeklyChange(goals.startingWeight, goals.targetWeight ?? goals.startingWeight),
        calculatedWeeks: goals.calculatedWeeks ?? calculateWeeksToGoal(goals.startingWeight, goals.targetWeight ?? goals.startingWeight)
      };

      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      return handleResponse(response);
    },
    /** Resets all goals */
    deleteWeightGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    // --- NEW Weight Log Endpoints ---
    /** Fetches the user's weight log history */
    getWeightLog: async (): Promise<WeightLogEntry[]> => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
        headers: getHeaders(false),
      });
      // The backend returns an array, potentially empty, matching WeightLogEntry[]
      return handleResponse(response);
    },

    /** Adds a new weight log entry */
    addWeightLogEntry: async (
      payload: AddWeightLogPayload
    ): Promise<WeightLogEntry> => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      // Backend returns the created entry including id, timestamp, and weight
      const fullEntry = await handleResponse(response);
      return {
        id: fullEntry.id,
        timestamp: fullEntry.timestamp,
        weight: fullEntry.weight,
      };
    },

    /** Deletes a specific weight log entry */
    deleteWeightLogEntry: async (
      id: string
    ): Promise<{ success: boolean; id: string }> => {
      const response = await fetch(
        `${API_BASE_URL}/api/goals/weight-log/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(false),
        }
      );
      // Backend now returns { success: true, id: 'deleted_id' }
      return handleResponse(response);
    },
    // --- END NEW Weight Log Endpoints ---
  },
  habits: {
    /** Get all habit goals */
    getHabit: async (): Promise<HabitGoalPayload[]> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    /** Saves a new habit goal */
    saveHabit: async (
      habitGoal: HabitGoalPayload
    ): Promise<HabitGoalPayload> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(habitGoal),
      });
      return handleResponse(response);
    },

    /** Updates an existing habit goal */
    updateHabit: async (
      id: string,
      habitGoal: HabitGoalPayload
    ): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(habitGoal),
      });
      return handleResponse(response);
    },

    /** Deletes a habit goal */
    deleteHabit: async (id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(response);
    },

    /** Reset all habit goals */
    resetHabit: async (): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return handleResponse(response);
    },
  },
};

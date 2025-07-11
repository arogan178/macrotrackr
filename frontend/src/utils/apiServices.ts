/**
 * API Service - Centralizes API calls and standardizes error handling
 * Updated for simplified calorie target model and refactored goal/macro endpoints.
 */

// Assuming these imports exist and work as intended in your frontend structure
import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "@/features/goals/calculations";
import type { WeightGoalFormValues } from "@/features/goals/types";
import { getActivityLevelFromString } from "@/features/settings/utils/constants"; // Adjust path as needed
import { ActivityLevel } from "@/types/user"; // Adjust path as needed

import { getToken } from "./tokenStorage"; // Adjust path as needed

// API Base URL and Response Types
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- Interfaces for Payloads and Responses (camelCase) ---

// Payload for PUT /api/goals/weight (CREATE)
type SetWeightGoalPayload = {
  startingWeight: number; // Required for creation
  targetWeight: number | undefined;
  weightGoal: "lose" | "maintain" | "gain" | undefined;
  startDate: string | undefined;
  targetDate: string | undefined;
  calorieTarget: number | undefined;
  calculatedWeeks: number | undefined;
  weeklyChange: number | undefined;
  dailyChange: number | undefined;
};

// Payload for PUT /api/goals/weight (UPDATE)
// Omits startingWeight

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

// Type for the macro target settings object
type MacroTargetSettingsObject =
  | {
      proteinPercentage: number;
      carbsPercentage: number;
      fatsPercentage: number;
      lockedMacros?: Array<"protein" | "carbs" | "fats">;
    }
  | undefined;

// Payload for PUT /api/macros/target (updating settings ONLY)
type MacroTargetSettingsPayload = {
  macroTarget: MacroTargetSettingsObject;
};

// Type for response from GET /api/macros/target (settings ONLY)
type MacroTargetGetResponse =
  | {
      macroTarget: MacroTargetSettingsObject;
    }
  | undefined;

// --- User Details Response Type ---
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
  subscription: {
    status: "free" | "pro" | "canceled";
    hasStripeCustomer: boolean;
    subscription: {
      id: string;
      status: "active" | "canceled" | "past_due" | "unpaid";
      currentPeriodEnd: string;
      stripeSubscriptionId: string;
    } | null;
    price: string | null;
    paymentMethod: { brand: string; last4: string } | null;
    stripeDetails: any | null;
  };
}

// Payload for PUT /api/user/settings (User details ONLY)
// macroTarget removed
type UserSettingsPayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | undefined;
  height: number | undefined;
  weight: number | undefined;
  gender: "male" | "female" | undefined;
  activityLevel: number | undefined;
}>;

interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack"; // camelCase
  mealName?: string; // camelCase
  entryDate: string; // Updated to camelCase
  entryTime: string; // Updated to camelCase
}
export type MacroEntryUpdatePayload = Partial<MacroEntryCreatePayload>;

// Export the create payload for consistency
export type { MacroEntryCreatePayload };
interface ApiErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(
    message: string,
    status: number,
    code: string,
    details?: unknown,
  ) {
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
 * Updated to handle valid undefined/empty responses for 200 OK status.
 */
export async function handleResponse(response: Response): Promise<unknown> {
  // Handle successful responses (2xx status codes)
  if (response.ok) {
    // Handle specific 204 No Content responses
    if (response.status === 204) {
      return { success: true }; // Return a simple success indicator
    }
    // Try to parse successful JSON response, but handle potential undefined/empty body for 200 OK
    try {
      const responseBodyText = await response.clone().text();
      if (!responseBodyText) {
        return undefined;
      } // Return undefined if body is empty
      return await response.json(); // Parse JSON if body exists
    } catch (error) {
      console.warn("API Success Response (2xx) could not be parsed as JSON:", {
        status: response.status,
        error: error,
      });
      if (response.status === 200) {
        return undefined;
      } // Assume valid undefined/empty for 200
      throw new Error(
        "Received an invalid or unparsable response from the server.",
      );
    }
  }

  // Handle error responses (response.ok is false - 4xx, 5xx status codes)
  let errorPayload: ApiErrorResponse | undefined = undefined;
  let errorMessage = `API error (${response.status}): ${response.statusText}`;
  let errorCode = `HTTP_${response.status}`;
  let errorDetails: unknown = undefined;
  try {
    errorPayload = await response.json();
    if (errorPayload && typeof errorPayload === "object") {
      errorMessage = errorPayload.message || errorMessage;
      errorCode = errorPayload.code || errorCode;
      errorDetails = errorPayload.details;
    }
  } catch (error) {
    console.warn("API Error Response is not valid JSON:", error);
  }
  throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
}

export function getHeaders(includeContentType = true): Record<string, string> {
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

/**
 * Generic POST helper for API calls (used by billing helpers)
 */
export async function post<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    method: "POST",
    headers: getHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(response) as T;
}

/**
 * Centralized API service object with methods grouped by resource.
 */
export const apiService = {
  // User endpoints
  user: {
    /** Fetches the current authenticated user's profile */
    getUserDetails: async (): Promise<UserDetailsResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: getHeaders(false),
      });
      return (await handleResponse(response)) as UserDetailsResponse;
    },
    /** Updates user settings (profile details only) */
    updateSettings: async (settings: UserSettingsPayload) => {
      // Basic normalization (e.g., ensure activityLevel is number if sent as string)
      const payloadToSend = { ...settings };
      if (
        payloadToSend.activityLevel !== undefined &&
        payloadToSend.activityLevel !== undefined &&
        typeof payloadToSend.activityLevel === "string"
      ) {
        payloadToSend.activityLevel = getActivityLevelFromString(
          payloadToSend.activityLevel as ActivityLevel,
        );
      }
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(payloadToSend), // Send payload with only user details
      });
      return (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined;
    },
    /** Completes user profile */
    completeProfile: async (
      profileData: Partial<
        Pick<
          UserSettingsPayload,
          "dateOfBirth" | "height" | "weight" | "activityLevel"
        >
      >,
    ) => {
      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(profileData),
        },
      );
      return (await handleResponse(response)) as WeightLogEntry[];
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
      return (await handleResponse(response)) as MacroTargetGetResponse;
    },
    validateEmail: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-email`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined;
    },
    register: async (userData: Record<string, unknown>) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(userData),
      });
      return (await handleResponse(response)) as WeightLogEntry[];
    },
    forgotPassword: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ email }),
      });
      return (await handleResponse(response)) as MacroTargetGetResponse;
    },
    resetPassword: async (token: string, newPassword: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ token, newPassword }),
      });
      return (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined;
    },
    changePassword: async (passwordCurrent: string, passwordNew: string) => {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ passwordCurrent, passwordNew }),
      });
      return (await handleResponse(response)) as WeightLogEntry[];
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
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
        mealType: entry.mealType,
        mealName: entry.mealName || "",
        entryDate: entry.entryDate,
        entryTime: entry.entryTime,
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
      if (entry.entryDate !== undefined) payload.entryDate = entry.entryDate;
      if (entry.entryTime !== undefined) payload.entryTime = entry.entryTime;
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
      return (await handleResponse(response)) as MacroTargetGetResponse;
    },
    /** Saves ONLY macro target settings */
    saveMacroTargetPercentages: async (payload: MacroTargetSettingsPayload) => {
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
    getWeightGoals: async (): Promise<SetWeightGoalPayload | undefined> => {
      // Return type might need adjustment based on backend response
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        headers: getHeaders(false),
      });
      return (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined;
    },
    /** Creates new weight goals */
    createWeightGoal: async (goals: WeightGoalFormValues, tdee: number) => {
      // Calculate the complete goal data including calorie targets
      const startingWeight = goals.startingWeight ?? 0;
      const targetWeight = goals.targetWeight ?? startingWeight;
      const payload = {
        ...goals,
        calorieTarget:
          goals.calorieTarget ??
          calculateCalorieTarget(tdee, startingWeight, targetWeight),
        weeklyChange:
          goals.weeklyChange ??
          calculateWeeklyChange(startingWeight, targetWeight),
        calculatedWeeks:
          goals.calculatedWeeks ??
          calculateWeeksToGoal(startingWeight, targetWeight),
        dailyChange: goals.dailyChange ?? undefined,
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
      const startingWeight = goals.startingWeight ?? 0;
      const targetWeight = goals.targetWeight ?? startingWeight;
      const payload = {
        ...goals,
        calorieTarget:
          goals.calorieTarget ??
          calculateCalorieTarget(tdee, startingWeight, targetWeight),
        weeklyChange:
          goals.weeklyChange ??
          calculateWeeklyChange(startingWeight, targetWeight),
        calculatedWeeks:
          goals.calculatedWeeks ??
          calculateWeeksToGoal(startingWeight, targetWeight),
        dailyChange: goals.dailyChange ?? undefined,
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
      return (await handleResponse(response)) as WeightLogEntry[];
    },

    /** Adds a new weight log entry */
    addWeightLogEntry: async (
      payload: AddWeightLogPayload,
    ): Promise<WeightLogEntry> => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      // Backend returns the created entry including id, timestamp, and weight
      const fullEntry = (await handleResponse(response)) as WeightLogEntry;
      return {
        id: fullEntry.id,
        timestamp: fullEntry.timestamp,
        weight: fullEntry.weight,
      };
    },

    /** Deletes a specific weight log entry */
    deleteWeightLogEntry: async (
      id: string,
    ): Promise<{ success: boolean; id: string }> => {
      const response = await fetch(
        `${API_BASE_URL}/api/goals/weight-log/${id}`,
        {
          method: "DELETE",
          headers: getHeaders(false),
        },
      );
      // Backend now returns { success: true, id: 'deleted_id' }
      return (await handleResponse(response)) as {
        success: boolean;
        id: string;
      };
    },
    // --- END NEW Weight Log Endpoints ---
  },
  habits: {
    /** Get all habit goals */
    getHabit: async (): Promise<HabitGoalPayload[]> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        headers: getHeaders(false),
      });
      return (await handleResponse(response)) as HabitGoalPayload[];
    },

    /** Saves a new habit goal */
    saveHabit: async (
      habitGoal: HabitGoalPayload,
    ): Promise<HabitGoalPayload> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(habitGoal),
      });
      return (await handleResponse(response)) as HabitGoalPayload;
    },

    /** Updates an existing habit goal */
    updateHabit: async (
      id: string,
      habitGoal: HabitGoalPayload,
    ): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(habitGoal),
      });
      return (await handleResponse(response)) as { success: boolean };
    },

    /** Deletes a habit goal */
    deleteHabit: async (id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return (await handleResponse(response)) as { success: boolean };
    },

    /** Reset all habit goals */
    resetHabit: async (): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      return (await handleResponse(response)) as { success: boolean };
    },
  },
};

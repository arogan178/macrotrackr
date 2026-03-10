// --- Reporting ---
/**
 * API Service - Centralizes API calls and standardizes error handling
 * Updated for simplified calorie target model and refactored goal/macro endpoints.
 * Updated for Clerk SSO integration.
 */

// Assuming these imports exist and work as intended in your frontend structure
import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "@/features/goals/calculations";
import type { WeightGoalFormValues } from "@/features/goals/types";
import type { MacroEntry } from "@/types/macro";
import { ActivityLevel } from "@/types/user"; // Adjust path as needed
import { getActivityLevelFromString } from "@/utils/userConstants";

export interface MacroDensitySummaryParameters {
  startDate?: string;
  endDate?: string;
  groupBy?: string;
}

export interface MacroDensitySummaryItem {
  period: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  count: number;
} // Adjust path as needed

interface MacroHistoryResponse {
  entries: MacroEntry[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  limits?: unknown;
}

export interface FoodSearchResult {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
  rawQuantity?: string;
}

// API Base URL and Response Types
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

// --- Interfaces for Payloads and Responses (camelCase) ---

// Payload for PUT /api/goals/weight (CREATE/UPDATE response)
type SetWeightGoalPayload = {
  startingWeight: number; // Required for creation
  currentWeight: number | undefined; // Latest weight from weight log
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
  isProfileComplete: boolean;
  subscription: {
    status: "free" | "pro" | "canceled";
    hasStripeCustomer: boolean;
    currentPeriodEnd: string | undefined;
  };
}

export interface AuthSyncResponse {
  id: number;
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
  message: string;
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

  const root = value as Record<string, unknown>;
  const candidateRaw =
    root && typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : root;

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
      typeof candidate.dateOfBirth === "string"
        ? candidate.dateOfBirth
        : undefined,
    height: typeof candidate.height === "number" ? candidate.height : undefined,
    weight: typeof candidate.weight === "number" ? candidate.weight : undefined,
    gender:
      typeof candidate.gender === "string" ? candidate.gender : undefined,
    activityLevel:
      typeof candidate.activityLevel === "number"
        ? candidate.activityLevel
        : undefined,
    isProfileComplete:
      typeof candidate.isProfileComplete === "boolean"
        ? candidate.isProfileComplete
        : Boolean(candidate.dateOfBirth),
    subscription:
      candidate.subscription && typeof candidate.subscription === "object"
        ? {
            status:
              (candidate.subscription as Record<string, unknown>).status === "pro" ||
              (candidate.subscription as Record<string, unknown>).status === "canceled"
                ? ((candidate.subscription as Record<string, unknown>).status as
                    | "pro"
                    | "canceled")
                : "free",
            hasStripeCustomer:
              typeof (candidate.subscription as Record<string, unknown>)
                .hasStripeCustomer === "boolean"
                ? ((candidate.subscription as Record<string, unknown>)
                    .hasStripeCustomer as boolean)
                : false,
            currentPeriodEnd:
              typeof (candidate.subscription as Record<string, unknown>)
                .currentPeriodEnd === "string"
                ? ((candidate.subscription as Record<string, unknown>)
                    .currentPeriodEnd as string)
                : undefined,
          }
        : {
            status: "free",
            hasStripeCustomer: false,
            currentPeriodEnd: undefined,
          },
  };
}

export interface BillingDetailsResponse {
  subscription:
    | {
        id: string;
        status: string;
        currentPeriodEnd: string | null;
        stripeSubscriptionId: string | null;
      }
    | null;
  price: string | null;
  paymentMethod:
    | {
        brand: string;
        last4: string;
      }
    | null;
  stripeDetails:
    | {
        id: string;
        customer: string;
        status: string;
        current_period_end: number;
      }
     | null;
}

export interface BillingSessionResponse {
  sessionId?: string;
  url: string;
}

export interface BillingCancelResponse {
  success: boolean;
  message: string;
}

export type UserSettingsPayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string | undefined;
  height: number | undefined;
  weight: number | undefined;
  gender: "male" | "female" | undefined;
  activityLevel: number | undefined;
}>; 

export interface SavedMeal {
  id: number;
  userId: number;
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType: string;
  createdAt: string;
  updatedAt: string;
  ingredients?: import("@/types/macro").Ingredient[];
}

export interface SavedMealsResponse {
  meals: SavedMeal[];
  count: number;
  limit: number;
  isPro: boolean;
}

export interface CreateSavedMealPayload {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients?: import("@/types/macro").Ingredient[];
}

interface MacroEntryCreatePayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack"; // camelCase
  mealName?: string; // camelCase
  entryDate: string; // Updated to camelCase
  entryTime: string; // Updated to camelCase
  ingredients?: import("@/types/macro").Ingredient[];
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

function isFoodSearchResult(value: unknown): value is FoodSearchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.name === "string" &&
    typeof candidate.protein === "number" &&
    typeof candidate.carbs === "number" &&
    typeof candidate.fats === "number" &&
    typeof candidate.energyKcal === "number" &&
    typeof candidate.categories === "string" &&
    typeof candidate.servingQuantity === "number" &&
    typeof candidate.servingUnit === "string" &&
    (candidate.rawQuantity === undefined || typeof candidate.rawQuantity === "string")
  );
}

export function normalizeFoodSearchResults(value: unknown): FoodSearchResult[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is FoodSearchResult => isFoodSearchResult(item));
}

// Habit Goal Payload
type HabitGoalPayload = {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?:
    | "indigo"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "lime"
    | "yellow"
    | "orange"
    | "red"
    | "pink"
    | "purple";
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

// Clerk token getter - will be set by useClerkAuth hook
let getClerkToken: (() => Promise<string | null>) | null = null;

/**
 * Set the Clerk token getter function
 * Called by useClerkAuth hook to provide fresh tokens
 */
export function setGetToken(function_: () => Promise<string | null>) {
  getClerkToken = function_;
}

/**
 * Set a static auth token (for immediate use after sign in)
 */
let staticAuthToken: string | null = null;
export function setAuthToken(token: string | null) {
  staticAuthToken = token;
}

/**
 * Get the current auth token (Clerk or static)
 */
export async function getAuthToken(): Promise<string | null> {
  if (getClerkToken) {
    const freshToken = await getClerkToken();
    if (freshToken) {
      return freshToken;
    }
  }
  if (staticAuthToken) {
    return staticAuthToken;
  }
  return null;
}

export function getHeaders(includeContentType = true): Record<string, string> {
  const headers: Record<string, string> = {};
  // Note: This synchronous version is for backward compatibility
  // Use getHeadersAsync for async token retrieval with Clerk
  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

/**
 * Async version of getHeaders that properly retrieves Clerk tokens
 */
export async function getHeadersAsync(
  includeContentType = true,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const token = await getAuthToken();

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
    headers: await getHeadersAsync(),
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
  return handleResponse(response) as T;
}

/**
 * Centralized API service object with methods grouped by resource.
 */
export const apiService = {
  reporting: {
    /** Fetches nutrient density summary for a date range and grouping */
    getMacroDensitySummary: async (
      parameters: MacroDensitySummaryParameters = {},
    ): Promise<MacroDensitySummaryItem[]> => {
      const url = new URL(
        `${API_BASE_URL}/api/reporting/nutrient-density-summary`,
      );
      if (parameters.startDate)
        url.searchParams.append("startDate", parameters.startDate);
      if (parameters.endDate)
        url.searchParams.append("endDate", parameters.endDate);
      if (parameters.groupBy)
        url.searchParams.append("groupBy", parameters.groupBy);
      const response = await fetch(url.toString(), {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as MacroDensitySummaryItem[];
    },
  },
  // User endpoints
  user: {
    /** Fetches the current authenticated user's profile */
    getUserDetails: async (): Promise<UserDetailsResponse> => {
      const fetchUserDetails = async (): Promise<unknown> => {
        const url = `${API_BASE_URL}/api/user/me`;
        const response = await fetch(url, {
          headers: await getHeadersAsync(false),
          credentials: "include",
        });
        return handleResponse(response);
      };

      const result = await fetchUserDetails();
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
    syncAndGetUserDetails: async (token?: string): Promise<UserDetailsResponse> => {
      await apiService.auth.syncUser(token);
      return apiService.user.getUserDetails();
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
        headers: await getHeadersAsync(),
        body: JSON.stringify(payloadToSend), // Send payload with only user details
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        success: boolean;
        message: string;
      };
    },
    /** Completes user profile */
    completeProfile: async (
      profileData: Partial<
        Pick<
          UserSettingsPayload,
          "dateOfBirth" | "height" | "weight" | "gender" | "activityLevel"
        >
      >,
    ) => {
      const response = await fetch(
        `${API_BASE_URL}/api/user/complete-profile`,
        {
          method: "POST",
          headers: await getHeadersAsync(),
          body: JSON.stringify(profileData),
          credentials: "include",
        },
      );
      return (await handleResponse(response)) as {
        success: boolean;
        message: string;
      };
    },
  },

  // Authentication endpoints
  auth: {
    /**
     * Supports password reset links issued before the Clerk migration.
     */
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
    /**
     * Sync Clerk user with backend database
     * Called after successful Clerk authentication to ensure user exists in our DB
     */
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
  },

  // Macro entry endpoints
  macros: {
    getDailyTotals: async ({
      startDate,
      endDate,
    }: { startDate?: string; endDate?: string } = {}) => {
      let url = `${API_BASE_URL}/api/macros/totals`;
      const parameters = [];
      if (startDate)
        parameters.push(`startDate=${encodeURIComponent(startDate)}`);
      if (endDate) parameters.push(`endDate=${encodeURIComponent(endDate)}`);
      if (parameters.length > 0) url += `?${parameters.join("&")}`;
      const response = await fetch(url, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return handleResponse(response);
    },
    /**
     * Fetches paginated macro history
     * @param {number} [limit=20] - Number of entries per page
     * @param {number} [offset=0] - Offset for pagination
     * @returns {Promise<{ entries: MacroEntry[]; total: number; limit: number; offset: number; hasMore: boolean; }>}
     */
    getHistory: async (
      limit = 20,
      offset = 0,
      { startDate, endDate }: { startDate?: string; endDate?: string } = {},
    ) => {
      let url = `${API_BASE_URL}/api/macros/history?limit=${limit}&offset=${offset}`;
      if (startDate) url += `&startDate=${encodeURIComponent(startDate)}`;
      if (endDate) url += `&endDate=${encodeURIComponent(endDate)}`;
      const response = await fetch(url, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return handleResponse(response);
    },
    getAllHistory: async (
      options: { startDate?: string; endDate?: string } = {},
    ): Promise<{ entries: MacroEntry[]; limits?: unknown }> => {
      const pageSize = 100;
      let offset = 0;
      let hasMore = true;
      const entries: MacroEntry[] = [];
      let limits: unknown;

      while (hasMore) {
        const response = (await apiService.macros.getHistory(
          pageSize,
          offset,
          options,
        )) as MacroHistoryResponse;

        if (Array.isArray(response.entries)) {
          entries.push(...response.entries);
        }

        limits = response.limits ?? limits;
        hasMore = response.hasMore === true;
        offset += pageSize;

        if (offset > 50_000) {
          break;
        }
      }

      return {
        entries,
        limits,
      };
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
        ingredients: entry.ingredients,
      };
      const response = await fetch(`${API_BASE_URL}/api/macros`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
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
      if (entry.ingredients !== undefined) payload.ingredients = entry.ingredients;
      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "PUT",
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return handleResponse(response);
    },
    deleteEntry: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/macros/${id}`, {
        method: "DELETE",
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return handleResponse(response);
    },

    /** Gets ONLY macro target percentages object */
    getMacroTarget: async (): Promise<MacroTargetGetResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/macros/target`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
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
        headers: await getHeadersAsync(),
        body: JSON.stringify({ macroTarget: payload.macroTarget }),
        credentials: "include",
      });
      return handleResponse(response);
    },
    search: async (query: string): Promise<FoodSearchResult[]> => {
      const normalizedQuery = query.trim();
      if (normalizedQuery.length < 2) {
        return [];
      }

      const response = await fetch(
        `${API_BASE_URL}/api/macros/search?q=${encodeURIComponent(normalizedQuery)}`,
        {
          headers: await getHeadersAsync(false),
          credentials: "include",
        },
      );
      return normalizeFoodSearchResults(await handleResponse(response));
    },
  },

  // Goals endpoints
  goals: {
    /** Gets weight goals (including calorieTarget); returns undefined when not set */
    getWeightGoals: async (): Promise<SetWeightGoalPayload | undefined> => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      const result = (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined
        | null;
      // Normalize null -> undefined (lint preference) so downstream always checks falsy
      return result === null ? undefined : result;
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
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return handleResponse(response);
    },

    /** Updates existing weight goals */
    updateWeightGoal: async (goals: WeightGoalFormValues, tdee: number) => {
      // Calculate the complete goal data including calorie targets
      const startingWeight = goals.startingWeight ?? 0;
      const targetWeight = goals.targetWeight ?? startingWeight;
      const payload = {
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
        targetWeight: goals.targetWeight,
        weightGoal: goals.weightGoal,
        startDate: goals.startDate,
        targetDate: goals.targetDate,
      };

      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "PUT",
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return handleResponse(response);
    },
    /** Resets all goals */
    deleteWeightGoals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
        method: "DELETE",
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return handleResponse(response);
    },

    // --- NEW Weight Log Endpoints ---
    /** Fetches the user's weight log history */
    getWeightLog: async (): Promise<WeightLogEntry[]> => {
      const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
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
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
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
          headers: await getHeadersAsync(false),
          credentials: "include",
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
  billing: {
    /** Fetches detailed billing and subscription info for the current user */
    getBillingDetails: async (): Promise<BillingDetailsResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/billing/details`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as BillingDetailsResponse;
    },
    cancelSubscription: async (): Promise<BillingCancelResponse> => {
      return post<BillingCancelResponse>("/api/billing/cancel");
    },
    createCheckoutSession: async (
      successUrl: string,
      cancelUrl: string,
      plan: "monthly" | "yearly" = "monthly",
    ): Promise<BillingSessionResponse> => {
      return post<BillingSessionResponse>("/api/billing/checkout", {
        successUrl,
        cancelUrl,
        plan,
      });
    },
    createPortalSession: async (
      returnUrl: string,
    ): Promise<BillingSessionResponse> => {
      return post<BillingSessionResponse>("/api/billing/portal", { returnUrl });
    },
  },
  habits: {
    /** Get all habit goals */
    getHabits: async (): Promise<HabitGoalPayload[]> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as HabitGoalPayload[];
    },

    /** Saves a new habit goal */
    saveHabit: async (
      habitGoal: HabitGoalPayload,
    ): Promise<HabitGoalPayload> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify(habitGoal),
        credentials: "include",
      });
      return (await handleResponse(response)) as HabitGoalPayload;
    },

    /** Updates an existing habit goal */
    updateHabit: async (
      id: string,
      habitGoal: HabitGoalPayload,
    ): Promise<HabitGoalPayload> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "PUT",
        headers: await getHeadersAsync(),
        body: JSON.stringify(habitGoal),
        credentials: "include",
      });
      return (await handleResponse(response)) as HabitGoalPayload;
    },

    /** Deletes a habit goal */
    deleteHabit: async (id: string): Promise<{ success: boolean; id: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "DELETE",
        headers: await getHeadersAsync(),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean; id: string };
    },

    /** Reset all habit goals */
    resetHabit: async (): Promise<{ success: boolean; count: number }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "DELETE",
        headers: await getHeadersAsync(),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean; count: number };
    },
  },
  
  // Saved Meals API
  savedMeals: {
    /** Get all saved meals for the current user */
    getAll: async (): Promise<SavedMealsResponse> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as SavedMealsResponse;
    },

    /** Create a new saved meal */
    create: async (payload: CreateSavedMealPayload): Promise<SavedMeal> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return (await handleResponse(response)) as SavedMeal;
    },

    /** Delete a saved meal */
    delete: async (id: number): Promise<{ success: boolean; id: number }> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals/${id}`, {
        method: "DELETE",
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean; id: number };
    },
  },

  // Add methods for Clerk integration
  setGetToken,
  setAuthToken,
  getAuthToken,
};

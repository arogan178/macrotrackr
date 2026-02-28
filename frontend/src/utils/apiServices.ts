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

function isUserDetailsResponse(value: unknown): value is UserDetailsResponse {
  if (!value || typeof value !== "object") {
    console.log("[DEBUG] isUserDetailsResponse: value is not an object", value);
    return false;
  }

  const candidate = value as Record<string, unknown>;
  
  // DEBUG: Log the validation checks
  console.log("[DEBUG] isUserDetailsResponse validation:", {
    hasId: typeof candidate.id === "number",
    idValue: candidate.id,
    hasEmail: typeof candidate.email === "string",
    emailValue: candidate.email,
    hasFirstName: typeof candidate.firstName === "string",
    firstNameValue: candidate.firstName,
    hasLastName: typeof candidate.lastName === "string",
    lastNameValue: candidate.lastName,
  });
  
  return (
    typeof candidate.id === "number" &&
    typeof candidate.email === "string" &&
    typeof candidate.firstName === "string" &&
    typeof candidate.lastName === "string"
  );
}

function normalizeUserDetailsResponse(value: unknown): UserDetailsResponse | null {
  // DEBUG: Log the raw response
  console.log("[DEBUG] normalizeUserDetailsResponse - raw value:", JSON.stringify(value, null, 2));
  
  if (!value || typeof value !== "object") {
    return null;
  }

  const root = value as Record<string, unknown>;
  const candidateRaw =
    root && typeof root.data === "object" && root.data !== null
      ? (root.data as Record<string, unknown>)
      : root;

  // DEBUG: Log the candidate extraction
  console.log("[DEBUG] normalizeUserDetailsResponse - candidateRaw:", JSON.stringify(candidateRaw, null, 2));

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
        currentPeriodEnd: string;
        stripeSubscriptionId: string;
      }
    | undefined;
  price: string | undefined;
  paymentMethod:
    | {
        brand: string;
        last4: string;
      }
    | undefined;
  stripeDetails:
    | {
        id: string;
        customer: string;
        status: string;
        current_period_end: number;
      }
    | undefined;
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
  if (staticAuthToken) {
    return staticAuthToken;
  }
  if (getClerkToken) {
    return await getClerkToken();
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
  
  // DEBUG: Log token retrieval
  console.log("[DEBUG] getHeadersAsync - Token retrieval:", {
    hasToken: !!token,
    tokenLength: token?.length,
    tokenPreview: token ? `${token.slice(0, 20)}...` : null
  });
  
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
        console.log("[DEBUG] getUserDetails - Fetching from:", url);
        
        const response = await fetch(url, {
          headers: await getHeadersAsync(false),
          credentials: "include",
        });
        
        console.log("[DEBUG] getUserDetails - Response status:", response.status);
        console.log("[DEBUG] getUserDetails - Response OK:", response.ok);
        
        const responseText = await response.text();
        console.log("[DEBUG] getUserDetails - Response text:", responseText);
        
        // Parse the text back to JSON for handleResponse
        const parsedResponse = new Response(responseText, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
        });
        
        return handleResponse(parsedResponse);
      };

      const initialResult = await fetchUserDetails();
      const normalizedInitialResult = normalizeUserDetailsResponse(initialResult);
      if (normalizedInitialResult) {
        return normalizedInitialResult;
      }

      // If backend returned an unexpected payload (e.g. {}), try to re-sync Clerk linkage once.
      const token = await getAuthToken();
      await apiService.auth.syncUser(token || undefined);

      const retryResult = await fetchUserDetails();
      const normalizedRetryResult = normalizeUserDetailsResponse(retryResult);
      if (normalizedRetryResult) {
        return normalizedRetryResult;
      }

      throw new ApiError(
        "Invalid user profile response from server",
        500,
        "INVALID_USER_RESPONSE",
        retryResult,
      );
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
      return (await handleResponse(response)) as
        | SetWeightGoalPayload
        | undefined;
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
      return (await handleResponse(response)) as WeightLogEntry[];
    },
  },

  // Authentication endpoints
  // Note: Login/Register/Forgot Password are now handled by Clerk
  // The backend validates Clerk JWT tokens for authenticated requests
  auth: {
    /**
     * @deprecated Use Clerk's SignIn component instead
     * Kept for backward compatibility during migration
     */
    login: async (email: string, password: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        token: string;
        user?: UserDetailsResponse;
      };
    },
    /**
     * @deprecated Clerk handles email validation automatically
     */
    validateEmail: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate-email`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      return (await handleResponse(response)) as { valid: boolean };
    },
    /**
     * @deprecated Use Clerk's SignUp component instead
     * Kept for backward compatibility during migration
     */
    register: async (userData: Record<string, unknown>) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify(userData),
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        token: string;
        user?: UserDetailsResponse;
      };
    },
    /**
     * @deprecated Use Clerk's password reset flow instead
     */
    forgotPassword: async (email: string) => {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        success: boolean;
        message?: string;
      };
    },
    /**
     * @deprecated Use Clerk's password reset flow instead
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
     * @deprecated Use Clerk's password management instead
     */
    changePassword: async (currentPassword: string, newPassword: string) => {
      const response = await fetch(`${API_BASE_URL}/api/user/password`, {
        method: "PUT",
        headers: await getHeadersAsync(),
        body: JSON.stringify({ currentPassword, newPassword }),
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
    syncUser: async (token?: string): Promise<UserDetailsResponse> => {
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
      return (await handleResponse(response)) as UserDetailsResponse;
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
    search: async (query: string) => {
      const response = await fetch(
        `${API_BASE_URL}/api/macros/search?q=${encodeURIComponent(query)}`,
        {
          headers: await getHeadersAsync(false),
          credentials: "include",
        },
      );
      return handleResponse(response);
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
  },
  habits: {
    /** Get all habit goals */
    getHabit: async (): Promise<HabitGoalPayload[]> => {
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
    ): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "PUT",
        headers: await getHeadersAsync(),
        body: JSON.stringify(habitGoal),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean };
    },

    /** Deletes a habit goal */
    deleteHabit: async (id: string): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
        method: "DELETE",
        headers: await getHeadersAsync(),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean };
    },

    /** Reset all habit goals */
    resetHabit: async (): Promise<{ success: boolean }> => {
      const response = await fetch(`${API_BASE_URL}/api/habits`, {
        method: "DELETE",
        headers: await getHeadersAsync(),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean };
    },
  },
  
  // Saved Meals API
  savedMeals: {
    /** Get all saved meals for the current user */
    getAll: async (): Promise<{
      meals: Array<{
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
      }>;
      count: number;
      limit: number;
      isPro: boolean;
    }> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        meals: Array<{
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
        }>;
        count: number;
        limit: number;
        isPro: boolean;
      };
    },

    /** Create a new saved meal */
    create: async (payload: {
      name: string;
      protein: number;
      carbs: number;
      fats: number;
      mealType?: "breakfast" | "lunch" | "dinner" | "snack";
      ingredients?: import("@/types/macro").Ingredient[];
    }): Promise<{
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
    }> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
        method: "POST",
        headers: await getHeadersAsync(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      return (await handleResponse(response)) as {
        id: number;
        userId: number;
        name: string;
        protein: number;
        carbs: number;
        fats: number;
        mealType: string;
        createdAt: string;
        updatedAt: string;
      };
    },

    /** Delete a saved meal */
    delete: async (id: number): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`${API_BASE_URL}/api/saved-meals/${id}`, {
        method: "DELETE",
        headers: await getHeadersAsync(false),
        credentials: "include",
      });
      return (await handleResponse(response)) as { success: boolean; message: string };
    },
  },

  // Add methods for Clerk integration
  setGetToken,
  setAuthToken,
  getAuthToken,
};

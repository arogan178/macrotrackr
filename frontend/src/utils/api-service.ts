/**
 * API Service - Centralizes API calls and standardizes error handling
 */

import {
  getActivityLevelValue,
  getActivityLevelFromString,
} from "@/features/settings/constants";
import { Gender, ActivityLevel } from "@/features/settings/types";

const API_BASE_URL = "http://localhost:3000";

// Define types for registration data
interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  height: number;
  weight: number;
  gender: Gender;
  activityLevel: ActivityLevel;
}

/**
 * Handles API response and performs common error processing
 */
async function handleResponse<T>(
  response: Response,
  isAuthAttempt = false
): Promise<T> {
  if (!response.ok) {
    // Handle authentication errors - skip session expiration handling for auth attempts
    if (response.status === 401 && !isAuthAttempt) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      throw new Error("Session expired. Please login again.");
    }

    // Try to extract error details from the response
    const errorData = await response.json().catch(() => ({
      message: `Request failed with status ${response.status}`,
    }));

    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Generates headers for API calls
 */
function getHeaders(includeContentType = true) {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem("token");

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/**
 * Normalizes registration data to match the expected backend format
 * This is for data transformation, not validation (which happens in the form)
 */
function normalizeRegistrationData(userData: any): RegistrationData {
  // Create a copy to avoid modifying the original object
  const normalizedData = { ...userData };

  // Normalize gender to string format expected by the backend
  if (normalizedData.gender !== undefined) {
    // Handle numeric gender values (from dropdown selections)
    if (
      typeof normalizedData.gender === "number" ||
      !isNaN(Number(normalizedData.gender))
    ) {
      const genderNum = Number(normalizedData.gender);
      normalizedData.gender = genderNum === 1 ? "male" : "female";
    }

    // Normalize string to lowercase
    if (typeof normalizedData.gender === "string") {
      normalizedData.gender = normalizedData.gender.toLowerCase() as Gender;
    }
  }

  // Normalize activityLevel to numeric format expected by the backend (1-5)
  if (normalizedData.activityLevel !== undefined) {
    // If it's already a number, keep it as is
    if (
      typeof normalizedData.activityLevel === "number" ||
      !isNaN(Number(normalizedData.activityLevel))
    ) {
      normalizedData.activityLevel = Number(normalizedData.activityLevel);
    }
    // If it's a string like "sedentary", convert to the corresponding number
    else if (typeof normalizedData.activityLevel === "string") {
      normalizedData.activityLevel = getActivityLevelFromString(
        normalizedData.activityLevel as ActivityLevel
      );
    }
  }

  return normalizedData as RegistrationData;
}

/**
 * Normalizes settings data before sending to the backend
 */
function normalizeSettingsData(settings: any): any {
  const normalizedSettings = { ...settings };

  // Ensure activity_level is sent as a number (1-5)
  if (normalizedSettings.activity_level !== undefined) {
    if (
      typeof normalizedSettings.activity_level === "number" ||
      !isNaN(Number(normalizedSettings.activity_level))
    ) {
      normalizedSettings.activity_level = Number(
        normalizedSettings.activity_level
      );
    } else if (typeof normalizedSettings.activity_level === "string") {
      normalizedSettings.activity_level = getActivityLevelFromString(
        normalizedSettings.activity_level as ActivityLevel
      );
    }
  }

  return normalizedSettings;
}

/**
 * Centralized API service with endpoint groups
 */
export const apiService = {
  // User endpoints
  user: {
    getProfile: async () => {
      const response = await fetch(`${API_BASE_URL}/api/user/me`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },

    updateSettings: async (settings: any) => {
      const normalizedSettings = normalizeSettingsData(settings);
      const response = await fetch(`${API_BASE_URL}/api/user/settings`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(normalizedSettings),
      });
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
      return handleResponse(response, true); // Mark this as an auth attempt
    },

    register: async (userData: any) => {
      try {
        // Normalize data to expected format before sending
        const normalizedData = normalizeRegistrationData(userData);

        const response = await fetch(
          `${API_BASE_URL}/api/auth/register-complete`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(normalizedData),
          }
        );
        return handleResponse(response, true); // Mark this as an auth attempt
      } catch (error) {
        // Handle normalization errors
        if (error instanceof Error) {
          throw new Error(error.message);
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
      return handleResponse(response, true); // Mark this as an auth attempt
    },
  },

  // Macro entry endpoints
  macros: {
    getDailyTotals: async () => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry`, {
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

    addEntry: async (entry: {
      protein: number;
      carbs: number;
      fats: number;
    }) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(entry),
      });
      return handleResponse(response);
    },

    updateEntry: async (
      id: number,
      entry: { protein: number; carbs: number; fats: number }
    ) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(entry),
      });
      return handleResponse(response);
    },

    deleteEntry: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/api/macro_entry/${id}`, {
        method: "DELETE",
        headers: getHeaders(false),
      });
      return handleResponse(response);
    },
  },
};

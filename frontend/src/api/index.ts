// API Service - Main entry point for all API modules
// Individual modules are in src/api/
// Use direct imports from specific modules for best performance

export { authApi } from "@/api/auth";
export { billingApi } from "@/api/billing";
export { API_BASE_URL, ApiError, getAuthToken, getHeaders, getHeadersAsync, handleResponse, post, setAuthToken, setGetToken } from "@/api/core";
export { type AddWeightLogPayload, goalsApi, type WeightLogEntry } from "@/api/goals";
export { type HabitGoalPayload, type HabitGoalUpdatePayload,habitsApi } from "@/api/habits";
export { type FoodSearchResult, type MacroEntryCreatePayload, type MacroEntryUpdatePayload,macrosApi } from "@/api/macros";
export { type MacroDensitySummaryItem, type MacroDensitySummaryParameters,reportingApi } from "@/api/reporting";
export { type CreateSavedMealPayload, type SavedMeal, savedMealsApi, type SavedMealsResponse } from "@/api/savedMeals";
export { createUserApi, initUserApi, type UserDetailsResponse, type UserSettingsPayload } from "@/api/user";

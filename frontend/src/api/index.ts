// API Service - Main entry point for all API modules
// Individual modules are in src/api/
// Use direct imports from specific modules for best performance

export { API_BASE_URL, ApiError, getAuthToken, getHeaders, getHeadersAsync, handleResponse, post, setAuthToken, setGetToken } from "@/api/core";
export { authApi } from "@/api/auth";
export { billingApi } from "@/api/billing";
export { macrosApi, type FoodSearchResult, type MacroEntryCreatePayload, type MacroEntryUpdatePayload } from "@/api/macros";
export { goalsApi, type AddWeightLogPayload, type WeightLogEntry } from "@/api/goals";
export { habitsApi, type HabitGoalPayload, type HabitGoalUpdatePayload } from "@/api/habits";
export { savedMealsApi, type CreateSavedMealPayload, type SavedMeal, type SavedMealsResponse } from "@/api/savedMeals";
export { reportingApi, type MacroDensitySummaryItem, type MacroDensitySummaryParameters } from "@/api/reporting";
export { createUserApi, initUserApi, type UserDetailsResponse, type UserSettingsPayload } from "@/api/user";

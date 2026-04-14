export { authApi } from "@/api/auth";
export { billingApi } from "@/api/billing";
export {
  API_BASE_URL,
  ApiError,
  apiClient,
  type GetHeadersOptions,
} from "@/api/core";
export { type AddWeightLogPayload, goalsApi, type WeightLogEntry } from "@/api/goals";
export {
  type HabitGoalPayload,
  type HabitGoalUpdatePayload,
  habitsApi,
} from "@/api/habits";
export {
  type FoodSearchResult,
  type MacroEntryCreatePayload,
  type MacroEntryUpdatePayload,
  macrosApi,
} from "@/api/macros";
export {
  type MacroDensitySummaryItem,
  type MacroDensitySummaryParameters,
  reportingApi,
} from "@/api/reporting";
export {
  type CreateSavedMealPayload,
  type SavedMeal,
  savedMealsApi,
  type SavedMealsResponse,
} from "@/api/savedMeals";
export { userApi, type UserDetailsResponse, type UserSettingsPayload } from "@/api/user";

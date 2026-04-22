import { apiClient } from "@/api/core";
import { isLocalAuthMode } from "@/config/runtime";
import type { MealType } from "@/types/macro";

export interface SavedMeal {
  id: number;
  name: string;
  mealType: MealType;
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  ingredients: unknown[];
  createdAt: string;
  updatedAt?: string;
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
  mealType?: MealType;
  ingredients?: unknown[];
}

export const savedMealsApi = {
  /**
   * @throws {ApiError}
   */
  getAll: async (): Promise<SavedMealsResponse> => {
    const response = await apiClient.get<SavedMealsResponse>("/api/saved-meals");

    if (isLocalAuthMode) {
      return {
        ...response,
        isPro: true,
      };
    }

    return response;
  },

  /**
   * @throws {ApiError}
   */
  create: async (payload: CreateSavedMealPayload): Promise<SavedMeal> => {
    return apiClient.post<SavedMeal>("/api/saved-meals", payload);
  },

  /**
   * @throws {ApiError}
   */
  delete: async (id: number): Promise<{ success: boolean; id: number }> => {
    return apiClient.del<{ success: boolean; id: number }>(`/api/saved-meals/${id}`);
  },
};

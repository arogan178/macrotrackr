import { API_BASE_URL, getHeaders, handleResponse } from "@/api/core";
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
  getAll: async (): Promise<SavedMealsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
      headers: await getHeaders(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as SavedMealsResponse;
  },

  create: async (payload: CreateSavedMealPayload): Promise<SavedMeal> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return (await handleResponse(response)) as SavedMeal;
  },

  delete: async (id: number): Promise<{ success: boolean; id: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals/${id}`, {
      method: "DELETE",
      headers: await getHeaders(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as { success: boolean; id: number };
  },
};

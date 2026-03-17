import { API_BASE_URL, getHeadersAsync, handleResponse } from "@/api/core";

export interface SavedMeal {
  id: number;
  name: string;
  mealType: string;
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
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
  ingredients?: unknown[];
}

export const savedMealsApi = {
  getAll: async (): Promise<SavedMealsResponse> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as SavedMealsResponse;
  },

  create: async (payload: CreateSavedMealPayload): Promise<SavedMeal> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals`, {
      method: "POST",
      headers: await getHeadersAsync(),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return (await handleResponse(response)) as SavedMeal;
  },

  delete: async (id: number): Promise<{ success: boolean; id: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/saved-meals/${id}`, {
      method: "DELETE",
      headers: await getHeadersAsync(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as { success: boolean; id: number };
  },
};

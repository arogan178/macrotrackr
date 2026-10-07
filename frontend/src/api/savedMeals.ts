import { api, unwrap } from "@/api/core";
import { isLocalAuthMode } from "@/config/runtime";
import type { Ingredient, MealType } from "@/types/macro";

export interface SavedMeal {
  id: number;
  name: string;
  mealType: MealType;
  protein: number;
  carbs: number;
  fats: number;
  ingredients: Ingredient[];
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

export type UpdateSavedMealPayload = Partial<CreateSavedMealPayload>;

// The backend types ingredients as unknown[]; it stores what the client sent.
const toSavedMeal = (meal: Omit<SavedMeal, "ingredients"> & { ingredients: unknown[] }) =>
  ({ ...meal, ingredients: meal.ingredients as Ingredient[] }) satisfies SavedMeal;

export const savedMealsApi = {
  /**
   * @throws {ApiError}
   */
  getAll: async (): Promise<SavedMealsResponse> => {
    const { meals, ...rest } = await unwrap(api.api["saved-meals"].get());

    return {
      ...rest,
      meals: meals.map(toSavedMeal),
      isPro: isLocalAuthMode || rest.isPro,
    };
  },

  /**
   * @throws {ApiError}
   */
  create: async (payload: CreateSavedMealPayload): Promise<SavedMeal> => {
    return toSavedMeal(await unwrap(api.api["saved-meals"].post(payload)));
  },

  /**
   * @throws {ApiError}
   */
  update: async (
    id: number,
    payload: UpdateSavedMealPayload,
  ): Promise<SavedMeal> => {
    return toSavedMeal(await unwrap(api.api["saved-meals"]({ id }).put(payload)));
  },

  /**
   * @throws {ApiError}
   */
  delete: async (id: number): Promise<{ success: boolean; id: number }> => {
    return unwrap(api.api["saved-meals"]({ id }).delete());
  },
};

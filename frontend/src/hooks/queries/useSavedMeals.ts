import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import { apiService } from "@/utils/apiServices";

import { Ingredient } from "@/types/macro";

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
  ingredients?: Ingredient[];
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
  ingredients?: Ingredient[];
}

// Query hook for getting all saved meals
export function useSavedMeals() {
  return useQuery({
    queryKey: queryKeys.savedMeals.list(),
    queryFn: async () => {
      const response = await apiService.savedMeals.getAll();
      return response as SavedMealsResponse;
    },
    ...queryConfigs.longLived,
  });
}

// Mutation hook for creating a saved meal
export function useCreateSavedMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.savedMeals.all(), "create"],
    mutationFn: async (payload: CreateSavedMealPayload) => {
      return (await apiService.savedMeals.create(payload)) as SavedMeal;
    },
    onSuccess: () => {
      // Invalidate saved meals list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedMeals.list(),
      });
    },
  });
}

// Mutation hook for deleting a saved meal
export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.savedMeals.all(), "delete"],
    mutationFn: async (id: number) => {
      return await apiService.savedMeals.delete(id);
    },
    onSuccess: () => {
      // Invalidate saved meals list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedMeals.list(),
      });
    },
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";
import {
  apiService,
  type CreateSavedMealPayload,
  type SavedMeal,
  type SavedMealsResponse,
} from "@/utils/apiServices";

export function useSavedMeals() {
  return useQuery({
    queryKey: queryKeys.savedMeals.list(),
    queryFn: (): Promise<SavedMealsResponse> => apiService.savedMeals.getAll(),
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

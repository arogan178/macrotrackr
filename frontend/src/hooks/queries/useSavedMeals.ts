import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateSavedMealPayload,
  type SavedMeal,
  savedMealsApi,
  type SavedMealsResponse,
} from "@/api/savedMeals";
import { queryConfigs } from "@/lib/queryClient";
import { queryKeys } from "@/lib/queryKeys";

export function useSavedMeals() {
  return useQuery({
    queryKey: queryKeys.savedMeals.list(),
    queryFn: (): Promise<SavedMealsResponse> => savedMealsApi.getAll(),
    ...queryConfigs.longLived,
  });
}

// Mutation hook for creating a saved meal
export function useCreateSavedMeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [...queryKeys.savedMeals.all(), "create"],
    mutationFn: async (payload: CreateSavedMealPayload) => {
      return (await savedMealsApi.create(payload)) as SavedMeal;
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
      return await savedMealsApi.delete(id);
    },
    onSuccess: () => {
      // Invalidate saved meals list to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.savedMeals.list(),
      });
    },
  });
}

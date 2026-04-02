import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  type CreateSavedMealPayload,
  type SavedMeal,
  savedMealsApi,
  type SavedMealsResponse,
} from "@/api/savedMeals";
import { createMutationErrorLogger } from "@/lib/mutationErrorHandling";
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
  const logCreateSavedMealError = createMutationErrorLogger(
    "Error creating saved meal",
  );

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
    onError: logCreateSavedMealError,
  });
}

// Mutation hook for deleting a saved meal
export function useDeleteSavedMeal() {
  const queryClient = useQueryClient();
  const logDeleteSavedMealError = createMutationErrorLogger(
    "Error deleting saved meal",
  );

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
    onError: logDeleteSavedMealError,
  });
}

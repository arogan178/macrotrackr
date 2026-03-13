import React, { useCallback, useMemo } from "react";
import { useLoaderData } from "@tanstack/react-router";

import { homeRoute } from "@/AppRouter";
import CardContainer from "@/components/form/CardContainer";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import UserMetricsPanel from "@/components/metrics/UserMetricsPanel";
import AddEntryForm from "@/features/macroTracking/components/AddEntryForm";
import DailySummaryPanel from "@/features/macroTracking/components/DailySummaryPanel";
import EditModal from "@/features/macroTracking/components/EditModal";
import EntryHistoryPanel from "@/features/macroTracking/components/EntryHistoryPanel";
import {
  AddEntryLoadingSkeleton,
  DailySummaryLoadingSkeleton,
  HistoryLoadingSkeleton,
} from "@/features/macroTracking/components/HomePageSkeletons";
import {
  useHistoryPagination,
  useHomeHeader,
  useNutritionProfile,
} from "@/features/macroTracking/hooks/useHomePage";
import type {
  EditingEntry,
  MacroEntryInput,
} from "@/features/macroTracking/types/macro";
import { downloadHistoryCsv } from "@/features/macroTracking/utils";
import { useUser } from "@/hooks/auth/useAuthQueries";
import {
  useAddMacroEntry,
  useDeleteMacroEntry,
  useMacroDailyTotals,
  useMacroTarget,
  useUpdateMacroEntry,
} from "@/hooks/queries/useMacroQueries";
import { useCreateSavedMeal, useDeleteSavedMeal, useSavedMeals } from "@/hooks/queries/useSavedMeals";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";
import { apiService } from "@/utils/apiServices";
import { todayISO } from "@/utils/dateUtilities";

export default function HomePage() {
  usePageDataSync();

  const { data: user } = useUser();

  const today = todayISO();
  const {
    data: macroDailyTotals = { protein: 0, carbs: 0, fats: 0, calories: 0 },
  } = useMacroDailyTotals(today);
  const { data: macroTarget } = useMacroTarget();

  const {
    history,
    historyHasMore,
    isHistoryLoading,
    isLoadingMore,
    loadMoreHistory,
    limits,
  } = useHistoryPagination(20);

  const { weightGoals } = useLoaderData({
    from: homeRoute.id,
  }) as any;

  const addMacroEntryMutation = useAddMacroEntry();
  const updateMacroEntryMutation = useUpdateMacroEntry();
  const deleteMacroEntryMutation = useDeleteMacroEntry();
  const createSavedMealMutation = useCreateSavedMeal();
  const deleteSavedMealMutation = useDeleteSavedMeal();
  const { data: savedMealsData } = useSavedMeals();
  const savedMeals = savedMealsData?.meals ?? [];
  const [isExportingHistory, setIsExportingHistory] = React.useState(false);

  const savedEntryIds = useMemo(() => {
    const ids = new Set<number>();
    for (const entry of history) {
      const entryName = entry.foodName || entry.mealName || "Saved Meal";
      const isSaved = savedMeals.some((sm) => 
        sm.name === entryName && 
        sm.protein === entry.protein && 
        sm.carbs === entry.carbs && 
        sm.fats === entry.fats && 
        sm.mealType === entry.mealType
      );
      if (isSaved) {
        ids.add(entry.id);
      }
    }
    return ids;
  }, [history, savedMeals]);

  const { editingEntry, setEditingEntry } = useStore();

  const nutritionProfile = useNutritionProfile(user ?? undefined);

  const handleAddEntry = useCallback(
    async (entry: MacroEntryInput) => {
      await addMacroEntryMutation.mutateAsync(entry);
    },
    [addMacroEntryMutation],
  );

  const handleSaveMeal = useCallback(
    async (entry: MacroEntry) => {
      if (!entry.foodName && !entry.mealName) return;
      
      try {
        await createSavedMealMutation.mutateAsync({
          name: entry.foodName || entry.mealName || "Saved Meal",
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          mealType: entry.mealType as any,
        });
      } catch (error) {
        console.error("Failed to save meal", error);
      }
    },
    [createSavedMealMutation]
  );

  const handleUnsaveMeal = useCallback(
    async (entry: MacroEntry) => {
      const entryName = entry.foodName || entry.mealName || "Saved Meal";
      const savedMeal = savedMeals.find((sm) => 
        sm.name === entryName && 
        sm.protein === entry.protein && 
        sm.carbs === entry.carbs && 
        sm.fats === entry.fats && 
        sm.mealType === entry.mealType
      );
      
      if (savedMeal) {
        try {
          await deleteSavedMealMutation.mutateAsync(savedMeal.id);
        } catch (error) {
          console.error("Failed to unsave meal", error);
        }
      }
    },
    [savedMeals, deleteSavedMealMutation]
  );

  const handleGroupMeals = useCallback(
    async (name: string, mealType: string, selectedEntries: MacroEntry[]) => {
      const totalProtein = selectedEntries.reduce(
        (sum, entry) => sum + entry.protein,
        0,
      );
      const totalCarbs = selectedEntries.reduce(
        (sum, entry) => sum + entry.carbs,
        0,
      );
      const totalFats = selectedEntries.reduce(
        (sum, entry) => sum + entry.fats,
        0,
      );

      const ingredients = selectedEntries.flatMap((entry) => {
        const ingredientName = entry.foodName || entry.mealName || "Ingredient";
        const singleIngredient =
          entry.ingredients?.length === 1
            ? entry.ingredients[0]
            : undefined;

        if (singleIngredient) {
          return {
            ...singleIngredient,
            name: singleIngredient.name || ingredientName,
            sourceEntryName: ingredientName,
            sourceEntryId: entry.id,
            baseProtein: singleIngredient.baseProtein ?? singleIngredient.protein,
            baseCarbs: singleIngredient.baseCarbs ?? singleIngredient.carbs,
            baseFats: singleIngredient.baseFats ?? singleIngredient.fats,
            baseQuantity: singleIngredient.baseQuantity ?? singleIngredient.quantity,
            baseUnit: singleIngredient.baseUnit ?? singleIngredient.unit,
          };
        }

        if (entry.ingredients && entry.ingredients.length > 1) {
          return entry.ingredients.map((ingredient) => ({
            ...ingredient,
            sourceEntryName: ingredientName,
            sourceEntryId: entry.id,
            baseProtein: ingredient.baseProtein ?? ingredient.protein,
            baseCarbs: ingredient.baseCarbs ?? ingredient.carbs,
            baseFats: ingredient.baseFats ?? ingredient.fats,
            baseQuantity: ingredient.baseQuantity ?? ingredient.quantity,
            baseUnit: ingredient.baseUnit ?? ingredient.unit,
          }));
        }

        return {
          name: ingredientName,
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          quantity: 1,
          unit: "unit",
          sourceEntryName: ingredientName,
          sourceEntryId: entry.id,
          baseProtein: entry.protein,
          baseCarbs: entry.carbs,
          baseFats: entry.fats,
          baseQuantity: 1,
          baseUnit: "unit",
        };
      });

      try {
        await createSavedMealMutation.mutateAsync({
          name,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          mealType: mealType as any,
          ingredients,
        });
      } catch (error) {
        console.error("Failed to save grouped meal", error);
      }
    },
    [createSavedMealMutation]
  );

  const handleEditEntry = useCallback(
    async (entry: EditingEntry | undefined) => {
      if (!entry) return;
      await updateMacroEntryMutation.mutateAsync({
        id: entry.id,
        entry: {
          protein: entry.protein,
          carbs: entry.carbs,
          fats: entry.fats,
          mealType: entry.mealType,
          mealName: entry.mealName,
          entryDate: entry.entryDate || "",
          entryTime: entry.entryTime || "",
          ingredients: entry.ingredients,
        },
      });
      setEditingEntry(undefined);
    },
    [updateMacroEntryMutation, setEditingEntry],
  );

  const handleDeleteEntry = useCallback(
    async (id: number) => {
      await deleteMacroEntryMutation.mutateAsync(id);
    },
    [deleteMacroEntryMutation],
  );

  const handleExportHistory = useCallback(async () => {
    setIsExportingHistory(true);
    try {
      const response = await apiService.macros.getAllHistory();
      downloadHistoryCsv(response.entries as MacroEntry[]);
    } finally {
      setIsExportingHistory(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setEditingEntry(undefined);
  }, [setEditingEntry]);

  const isLoading = isHistoryLoading;
  const isSaving = addMacroEntryMutation.isPending;
  const isEditing = updateMacroEntryMutation.isPending;
  const isDeleting = deleteMacroEntryMutation.isPending;

  const effectiveCalorieTarget =
    weightGoals?.calorieTarget || nutritionProfile?.tdee;

  const { title: headerTitle, subtitle: headerSubtitle } = useHomeHeader(
    user ?? undefined,
    isLoading,
  );

  return (
    <DashboardPageContainer>
      <FeaturePage title={headerTitle} subtitle={headerSubtitle} animateTitle>
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
            <div className="flex h-full flex-col space-y-5 lg:col-span-4">
              <UserMetricsPanel
                bmr={nutritionProfile?.bmr ?? 0}
                tdee={nutritionProfile?.tdee ?? 0}
                isLoading={isLoading}
              />

              <div className="flex-1">
                {isLoading ? (
                  <AddEntryLoadingSkeleton />
                ) : (
                  <AddEntryForm onSubmit={handleAddEntry} isSaving={isSaving} />
                )}
              </div>
            </div>

            <div className="flex h-full flex-col lg:col-span-2">
              {isLoading ? (
                <DailySummaryLoadingSkeleton />
              ) : (
                user && (
                  <DailySummaryPanel
                    macroDailyTotals={macroDailyTotals}
                    macroTarget={macroTarget ?? undefined}
                    calorieTarget={effectiveCalorieTarget}
                  />
                )
              )}
            </div>
          </div>

          <CardContainer variant="interactive" className="border-border/60">
            <div className="p-5">
              {isLoading ? (
                <HistoryLoadingSkeleton />
              ) : (
                <EntryHistoryPanel
                  history={history}
                  deleteEntry={handleDeleteEntry}
                  onEdit={setEditingEntry}
                  isDeleting={isDeleting}
                  isEditing={isEditing}
                  hasMore={historyHasMore}
                  onLoadMore={loadMoreHistory}
                  isLoadingMore={isLoadingMore}
                  limits={limits}
                  onSaveMeal={handleSaveMeal}
                  onUnsaveMeal={handleUnsaveMeal}
                  savedMealIds={savedEntryIds}
                  onGroupMeals={handleGroupMeals}
                  onExportCsv={handleExportHistory}
                  isExportingCsv={isExportingHistory}
                />
              )}
            </div>
          </CardContainer>

          <EditModal
            entry={editingEntry}
            onSave={handleEditEntry}
            onClose={handleCloseModal}
            isSaving={isEditing}
            isOpen={!!editingEntry}
          />
        </div>
      </FeaturePage>
    </DashboardPageContainer>
  );
}

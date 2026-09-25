import React, { useCallback, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";

import { macrosApi } from "@/api/macros";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import UserMetricsPanel from "@/components/metrics/UserMetricsPanel";
import Panel from "@/components/ui/Panel";
import AddEntryForm from "@/features/macroTracking/components/AddEntryForm";
import DailySummaryPanel from "@/features/macroTracking/components/DailySummaryPanel";
import DayNavigator from "@/features/macroTracking/components/DayNavigator";
import EditModal from "@/features/macroTracking/components/EditModal";
import EntryHistoryPanel from "@/features/macroTracking/components/EntryHistoryPanel";
import {
  AddEntryLoadingSkeleton,
  DailySummaryLoadingSkeleton,
  HistoryLoadingSkeleton,
} from "@/features/macroTracking/components/HomePageSkeletons";
import { useAddEntry } from "@/features/macroTracking/hooks/useAddEntry";
import {
  useHistoryPagination,
  useHomeDate,
  useHomeHeader,
  useNutritionProfile,
} from "@/features/macroTracking/hooks/useHomePage";
import type { EditingEntry } from "@/features/macroTracking/types/macro";
import { downloadHistoryCsv } from "@/features/macroTracking/utils";
import { useMutationErrorHandler } from "@/hooks";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useDeleteMacroEntry,
  useMacroDailyTotals,
  useMacroTargetQuery,
  useUpdateMacroEntry,
} from "@/hooks/queries/useMacroQueries";
import {
  useCreateSavedMeal,
  useDeleteSavedMeal,
  useSavedMeals,
} from "@/hooks/queries/useSavedMeals";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import type { MacroEntry } from "@/types/macro";
import type { NutritionProfileSource } from "@/utils/userConstants";

export default function HomePage() {
  usePageDataSync();

  const { data: user } = useUser();

  const navigate = useNavigate();
  const { date, today, oldestDate, isToday } = useHomeDate();
  const handleDateChange = useCallback(
    (next: string) => {
      navigate({
        to: "/home",
        search: { date: next === today ? undefined : next },
        replace: true,
      });
    },
    [navigate, today],
  );
  const {
    data: macroDailyTotals = { protein: 0, carbs: 0, fats: 0, calories: 0 },
  } = useMacroDailyTotals(date);
  const { data: macroTarget } = useMacroTargetQuery();
  const { data: weightGoals } = useWeightGoals();

  const {
    history,
    historyHasMore,
    isHistoryLoading,
    isLoadingMore,
    loadMoreHistory,
    limits,
  } = useHistoryPagination(20);

  const { addEntry: handleAddEntry, saveAsMeal: handleSaveMeal, isSaving } =
    useAddEntry();
  const updateMacroEntryMutation = useUpdateMacroEntry();
  const deleteMacroEntryMutation = useDeleteMacroEntry();
  const createSavedMealMutation = useCreateSavedMeal();
  const deleteSavedMealMutation = useDeleteSavedMeal();
  const { data: savedMealsData } = useSavedMeals();
  const savedMeals = useMemo(() => savedMealsData?.meals ?? [], [savedMealsData]);
  const [isExportingHistory, setIsExportingHistory] = React.useState(false);

  const savedEntryIds = useMemo(() => {
    const ids = new Set<number>();
    for (const entry of history) {
      const entryName = entry.foodName ?? entry.mealName;
      const isSaved = savedMeals.some(
        (sm) =>
          sm.name === entryName &&
          sm.protein === entry.protein &&
          sm.carbs === entry.carbs &&
          sm.fats === entry.fats &&
          sm.mealType === entry.mealType,
      );
      if (isSaved) {
        ids.add(entry.id);
      }
    }

    return ids;
  }, [history, savedMeals]);

  const { editingEntry, setEditingEntry, showNotification } = useStore();
  const { handleMutationError } = useMutationErrorHandler({
    onError: (message) => showNotification(message, "error"),
  });

  const nutritionProfileSource: NutritionProfileSource | undefined =
    user && (user.gender === "male" || user.gender === "female")
      ? {
          id: user.id,
          weight: user.weight,
          height: user.height,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          activityLevel: user.activityLevel,
        }
      : undefined;

  const nutritionProfile = useNutritionProfile(nutritionProfileSource);

  const handleUnsaveMeal = useCallback(
    async (entry: MacroEntry) => {
      const entryName = entry.foodName ?? entry.mealName;
      const savedMeal = savedMeals.find(
        (sm) =>
          sm.name === entryName &&
          sm.protein === entry.protein &&
          sm.carbs === entry.carbs &&
          sm.fats === entry.fats &&
          sm.mealType === entry.mealType,
      );

      if (!savedMeal) return;

      try {
        await deleteSavedMealMutation.mutateAsync(savedMeal.id);
      } catch (error) {
        handleMutationError(error, "removing saved meal");
      }
    },
    [savedMeals, deleteSavedMealMutation, handleMutationError],
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
        const ingredientName = entry.foodName ?? entry.mealName;
        const singleIngredient =
          entry.ingredients?.length === 1 ? entry.ingredients[0] : undefined;

        if (singleIngredient) {
          return {
            ...singleIngredient,
            name: singleIngredient.name || ingredientName,
            sourceEntryName: ingredientName,
            sourceEntryId: entry.id,
            baseProtein:
              singleIngredient.baseProtein ?? singleIngredient.protein,
            baseCarbs: singleIngredient.baseCarbs ?? singleIngredient.carbs,
            baseFats: singleIngredient.baseFats ?? singleIngredient.fats,
            baseQuantity:
              singleIngredient.baseQuantity ?? singleIngredient.quantity,
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
          mealType: mealType as "breakfast" | "lunch" | "dinner" | "snack",
          ingredients,
        });
      } catch (error) {
        handleMutationError(error, "saving grouped meal");
        throw error;
      }
    },
    [createSavedMealMutation, handleMutationError],
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
          entryDate: entry.entryDate ?? "",
          entryTime: entry.entryTime ?? "",
          ingredients: entry.ingredients,
        },
      });
      setEditingEntry(undefined);
    },
    [updateMacroEntryMutation, setEditingEntry],
  );

  const handleDeleteEntry = useCallback(
    async (id: number, options?: { undoable?: boolean }) => {
      const deleted = history.find((entry) => entry.id === id);
      try {
        await deleteMacroEntryMutation.mutateAsync(id);
      } catch (error) {
        handleMutationError(error, "deleting entry");

        return;
      }
      if (!deleted || options?.undoable === false) return;

      showNotification("Entry deleted", "success", {
        action: {
          label: "Undo",
          onClick: () => {
            // addEntry has already shown the error if this fails.
            handleAddEntry({
              protein: deleted.protein,
              carbs: deleted.carbs,
              fats: deleted.fats,
              mealType: deleted.mealType,
              mealName: deleted.mealName,
              entryDate: deleted.entryDate,
              entryTime: deleted.entryTime,
              ingredients: deleted.ingredients,
            }).catch(() => {});
          },
        },
      });
    },
    [
      history,
      deleteMacroEntryMutation,
      handleMutationError,
      showNotification,
      handleAddEntry,
    ],
  );

  const handleExportHistory = useCallback(async () => {
    setIsExportingHistory(true);
    try {
      const response = await macrosApi.getAllHistory();
      downloadHistoryCsv(response.entries as MacroEntry[]);
    } catch (error) {
      handleMutationError(error, "exporting history");
    } finally {
      setIsExportingHistory(false);
    }
  }, [handleMutationError]);

  const handleCloseModal = useCallback(() => {
    setEditingEntry(undefined);
  }, [setEditingEntry]);

  const isLoading = isHistoryLoading;
  const isEditing = updateMacroEntryMutation.isPending;
  const deletingId = deleteMacroEntryMutation.isPending
    ? deleteMacroEntryMutation.variables
    : undefined;
  const isDeleting = useCallback((id: number) => id === deletingId, [deletingId]);

  const effectiveCalorieTarget =
    weightGoals?.calorieTarget ?? nutritionProfile?.tdee;

  const { title: headerTitle, subtitle: headerSubtitle } = useHomeHeader(
    user ?? undefined,
    isLoading,
    history.length > 0,
    date,
  );

  return (
    <DashboardPageContainer>
      <FeaturePage
        title={headerTitle}
        subtitle={headerSubtitle}
        headerChildren={
          <DayNavigator
            date={date}
            today={today}
            oldestDate={oldestDate}
            onChange={handleDateChange}
          />
        }
      >
        <div className="space-y-3.5 sm:space-y-6">
          {/* The day comes first. On a phone the summary is what the user
              opened the app to see; the form used to push it below the fold. */}
          <div className="grid grid-cols-1 gap-3.5 sm:gap-5 md:grid-cols-6 md:items-start">
            <div className="flex flex-col space-y-3.5 md:order-2 md:col-span-2 md:space-y-2">
              {isLoading ? (
                <DailySummaryLoadingSkeleton />
              ) : (
                user && (
                  <DailySummaryPanel
                    macroDailyTotals={macroDailyTotals}
                    macroTarget={macroTarget ?? undefined}
                    calorieTarget={effectiveCalorieTarget}
                    date={isToday ? undefined : date}
                  />
                )
              )}

              {/* BMR and TDEE are reference figures, not the day's work. */}
              <UserMetricsPanel
                bmr={nutritionProfile?.bmr ?? 0}
                tdee={nutritionProfile?.tdee ?? 0}
                isLoading={isLoading}
              />
            </div>

            {/* Below md the form lives in the Log sheet, reached from the tab
                bar's primary action, so the day is what Home opens on. */}
            <div className="hidden md:order-1 md:col-span-4 md:block">
              {isLoading ? (
                <AddEntryLoadingSkeleton />
              ) : (
                <AddEntryForm
                  key={date}
                  onSubmit={handleAddEntry}
                  isSaving={isSaving}
                  defaultDate={isToday ? undefined : date}
                />
              )}
            </div>
          </div>

          <Panel padding="regular">
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
          </Panel>

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

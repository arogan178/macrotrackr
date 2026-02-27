import { useLoaderData } from "@tanstack/react-router";
import { useCallback } from "react";

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
import { useUser } from "@/hooks/auth/useAuthQueries";
import {
  useAddMacroEntry,
  useDeleteMacroEntry,
  useMacroDailyTotals,
  useMacroTarget,
  useUpdateMacroEntry,
} from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import { getTodayISO } from "@/utils/dateUtilities";

export default function HomePage() {
  usePageDataSync();

  const { data: user } = useUser();

  const today = getTodayISO();
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
  } = useHistoryPagination(20);

  const { weightGoals } = useLoaderData({
    from: homeRoute.id,
  }) as any;

  const addMacroEntryMutation = useAddMacroEntry();
  const updateMacroEntryMutation = useUpdateMacroEntry();
  const deleteMacroEntryMutation = useDeleteMacroEntry();

  const { editingEntry, setEditingEntry } = useStore();

  const nutritionProfile = useNutritionProfile(user ?? undefined);

  const handleAddEntry = useCallback(
    async (entry: MacroEntryInput) => {
      await addMacroEntryMutation.mutateAsync(entry);
    },
    [addMacroEntryMutation],
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

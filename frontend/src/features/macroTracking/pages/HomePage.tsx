import { useLoaderData } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
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
import { AddEntryLoadingSkeleton, DailySummaryLoadingSkeleton, HistoryLoadingSkeleton } from "@/features/macroTracking/components/HomePageSkeletons";
import { useHistoryPagination, useHomeHeader, useNutritionProfile } from "@/features/macroTracking/hooks/useHomePage";
import type { EditingEntry, MacroEntryInput } from "@/features/macroTracking/types/macro";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useAddMacroEntry, useDeleteMacroEntry, useMacroDailyTotals, useMacroTarget, useUpdateMacroEntry } from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";
import { getTodayISO } from "@/utils/dateUtilities";

// Refactored per plan. Behavior and styling remain unchanged.
// Original file reference for comparison: [frontend/src/features/macroTracking/pages/HomePage.tsx](frontend/src/features/macroTracking/pages/HomePage.tsx:1)

export default function HomePage() {
  // Centralize subscription status hydration
  usePageDataSync();

  // Get user data from useUser hook
  const { data: user } = useUser();

  // Get macro data from TanStack Query hooks
  const today = getTodayISO();
  const {
    data: macroDailyTotals = { protein: 0, carbs: 0, fats: 0, calories: 0 },
  } = useMacroDailyTotals(today);
  const { data: macroTarget } = useMacroTarget();

  // History pagination via hook (wraps infinite query)
  const {
    history,
    historyHasMore,
    isHistoryLoading,
    isLoadingMore,
    loadMoreHistory,
  } = useHistoryPagination(20);

  // Get weight goals from home route loader
  const { weightGoals } = useLoaderData({
    from: homeRoute.id,
  }) as any;

  // Macro mutations
  const addMacroEntryMutation = useAddMacroEntry();
  const updateMacroEntryMutation = useUpdateMacroEntry();
  const deleteMacroEntryMutation = useDeleteMacroEntry();

  // Only UI state from zustand
  const { editingEntry, setEditingEntry } = useStore();

  // Derive nutritionProfile locally from server user data
  const nutritionProfile = useNutritionProfile(user);

  // Handler for adding entries
  const handleAddEntry = useCallback(
    async (entry: MacroEntryInput) => {
      await addMacroEntryMutation.mutateAsync(entry);
    },
    [addMacroEntryMutation],
  );

  // Handler for editing entries that matches EditModal's expected signature
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

  // Handler for deleting entries
  const handleDeleteEntry = useCallback(
    async (id: number) => {
      await deleteMacroEntryMutation.mutateAsync(id);
    },
    [deleteMacroEntryMutation],
  );

  // Memoized close handler to prevent unnecessary re-renders
  const handleCloseModal = useCallback(() => {
    setEditingEntry(undefined);
  }, [setEditingEntry]);

  // Determine loading states from mutations and queries
  const isLoading = isHistoryLoading; // Use history loading state for initial load
  const isSaving = addMacroEntryMutation.isPending;
  const isEditing = updateMacroEntryMutation.isPending;
  const isDeleting = deleteMacroEntryMutation.isPending;

  const effectiveCalorieTarget =
    weightGoals?.calorieTarget || nutritionProfile?.tdee;

  // Header data via hook (memoized)
  const { title: headerTitle, subtitle: headerSubtitle } = useHomeHeader(
    user,
    isLoading,
  );

  return (
    <DashboardPageContainer>
      <FeaturePage title={headerTitle} subtitle={headerSubtitle}>
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
            <div className="flex h-full flex-col space-y-6 lg:col-span-4">
                {/* Metrics Panel */}
                <UserMetricsPanel
                  bmr={nutritionProfile?.bmr ?? 0}
                  tdee={nutritionProfile?.tdee ?? 0}
                  isLoading={isLoading}
                />

                {/* Add Entry Section */}
                <div className="flex-1">
                  {isLoading ? (
                    <AddEntryLoadingSkeleton />
                  ) : (
                    <AddEntryForm
                      onSubmit={handleAddEntry}
                      isSaving={isSaving}
                    />
                  )}
                </div>
              </div>

              {/* Today's Summary - Right side */}
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

          {/* History Section */}
          <CardContainer>
              <div className="p-6">
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

            {/* Edit Modal - Only render when editingEntry is not undefined */}
            <AnimatePresence>
              {editingEntry && (
                <EditModal
                  key="edit-modal"
                  entry={editingEntry}
                  onSave={handleEditEntry}
                  onClose={handleCloseModal}
                  isSaving={isEditing}
                />
              )}
            </AnimatePresence>
        </div>
      </FeaturePage>
    </DashboardPageContainer>
  );
}

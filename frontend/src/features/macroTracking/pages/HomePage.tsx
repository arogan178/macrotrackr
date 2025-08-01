import { useLoaderData } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useCallback, useMemo } from "react";

import { homeRoute } from "@/AppRouter";
import { CardContainer } from "@/components/form";
import FeaturePage from "@/components/layout/FeaturePage";
import { UserMetricsPanel } from "@/features/dashboard/components";
import {
  AddEntryForm,
  DailySummaryPanel,
  EditModal,
  EntryHistoryPanel,
} from "@/features/macroTracking/components";
// Notifications are handled by the global NotificationManager and store
import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { useUser } from "@/hooks/auth/useAuthQueries";
import {
  useAddMacroEntry,
  useDeleteMacroEntry,
  useMacroDailyTotals,
  useMacroHistoryInfinite,
  useMacroTarget,
  useUpdateMacroEntry,
} from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { useStore } from "@/store/store";

export default function HomePage() {
  // Centralize subscription status hydration
  usePageDataSync();

  // Get user data from useUser hook
  const { data: user } = useUser();

  // Get macro data from TanStack Query hooks
  const today = new Date().toISOString().split("T")[0];
  const {
    data: macroDailyTotals = { protein: 0, carbs: 0, fats: 0, calories: 0 },
  } = useMacroDailyTotals(today);
  const { data: macroTarget } = useMacroTarget();

  // Get paginated macro history using infinite query
  const {
    data: macroHistoryData,
    isLoading: isHistoryLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMacroHistoryInfinite(20);

  // Get weight goals from home route loader
  const { weightGoals } = useLoaderData({
    from: homeRoute.id,
  }) as any;

  // Extract history data from infinite query result
  const history =
    macroHistoryData?.pages?.flatMap((page) => page.entries) || [];
  const historyHasMore = hasNextPage;

  // Macro mutations
  const addMacroEntryMutation = useAddMacroEntry();
  const updateMacroEntryMutation = useUpdateMacroEntry();
  const deleteMacroEntryMutation = useDeleteMacroEntry();

  // Only UI state from zustand
  const { editingEntry, setEditingEntry } = useStore();

  // Derive nutritionProfile locally from server user data
  const nutritionProfile = useMemo(() => {
    if (user && typeof user.id === "number") {
      try {
        return createNutritionProfile(user as any);
      } catch (error) {
        console.warn("Could not calculate nutrition profile:", error);
        return { userId: user.id, bmr: 1800, tdee: 2200 };
      }
    }
    return;
  }, [user]);

  // Handler for adding entries
  const handleAddEntry = useCallback(
    async (entry: {
      protein: number;
      carbs: number;
      fats: number;
      mealType: "breakfast" | "lunch" | "dinner" | "snack";
      mealName: string;
      entryDate: string;
      entryTime: string;
    }) => {
      await addMacroEntryMutation.mutateAsync(entry);
    },
    [addMacroEntryMutation],
  );

  // Handler for editing entries that matches EditModal's expected signature
  const handleEditEntry = useCallback(
    async (entry: typeof editingEntry) => {
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

  // Infinite query-based pagination
  const loadMoreHistory = useCallback(async () => {
    if (hasNextPage) {
      await fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage]);

  // Loading indicator for "Load More" button
  const isLoadingMore = isFetchingNextPage;

  // Determine loading states from mutations and queries
  const isLoading = isHistoryLoading; // Use history loading state for initial load
  const isSaving = addMacroEntryMutation.isPending;
  const isEditing = updateMacroEntryMutation.isPending;
  const isDeleting = deleteMacroEntryMutation.isPending;

  const effectiveCalorieTarget =
    weightGoals?.calorieTarget || nutritionProfile?.tdee;

  return (
    <FeaturePage
      feature="macros"
      title={`Welcome back, ${isLoading ? "..." : user?.firstName || "User"}`}
      subtitle={new Date().toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })}
    >
      <div className="relative min-h-screen">
        <div>
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
                  <AddEntryForm onSubmit={handleAddEntry} isSaving={isSaving} />
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

          {/* Gap between AddEntryForm and EntryHistoryPanel */}
          <div className="my-8" />

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
      </div>
    </FeaturePage>
  );
}

// Extracted components for better organization
// Loading skeleton components
const AddEntryLoadingSkeleton = () => (
  <CardContainer>
    <div className="animate-pulse p-5">
      <div className="mb-4 h-4 w-1/2 rounded bg-surface"></div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-8 rounded bg-surface"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

const DailySummaryLoadingSkeleton = () => (
  <CardContainer className="h-full">
    <div className="h-full animate-pulse p-5">
      <div className="mb-4 h-5 w-1/2 rounded bg-surface"></div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-12 rounded bg-surface"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

const HistoryLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="mb-6 h-6 w-1/4 rounded bg-surface"></div>
    {[0, 1, 2].map((index) => (
      <div key={index} className="space-y-2">
        <div className="h-5 w-1/6 rounded bg-surface"></div>
        <div className="h-16 rounded bg-surface/50"></div>
      </div>
    ))}
  </div>
);

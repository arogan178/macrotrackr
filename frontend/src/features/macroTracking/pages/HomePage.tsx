import { useLoaderData } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { useCallback, useEffect } from "react";

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

  // Get state and actions from our store (UI state only)
  const {
    nutritionProfile,
    editingEntry,
    setNutritionProfile,
    setEditingEntry,
  } = useStore();

  // Hydrate nutritionProfile from loader user object
  useEffect(() => {
    if (user && typeof user.id === "number") {
      let nutritionProfile;
      try {
        nutritionProfile = createNutritionProfile(user as any);
      } catch (error) {
        console.warn("Could not calculate nutrition profile:", error);
        nutritionProfile = { userId: user.id, bmr: 1800, tdee: 2200 };
      }
      setNutritionProfile(nutritionProfile);
    }
  }, [user, setNutritionProfile]);

  // Debug: Log when HomePage renders and when useEffect runs
  console.log("[HomePage] Rendered", {
    user,
    macroTarget,
    macroDailyTotals,
    history,
  });

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
      console.log("Editing entry:", entry);
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
    [updateMacroEntryMutation],
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

  // Debug effect to track editingEntry changes
  useEffect(() => {
    console.log("EditingEntry changed:", editingEntry);
  }, [editingEntry]);

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
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
            <div className="lg:col-span-4 flex flex-col h-full space-y-6">
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
            <div className="lg:col-span-2 flex flex-col h-full">
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
  );
}

// Extracted components for better organization
// Loading skeleton components
const AddEntryLoadingSkeleton = () => (
  <CardContainer>
    <div className="p-5 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-8 bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

const DailySummaryLoadingSkeleton = () => (
  <CardContainer className="h-full">
    <div className="p-5 h-full animate-pulse">
      <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="space-y-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-12 bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

const HistoryLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
    {[0, 1, 2].map((index) => (
      <div key={index} className="space-y-2">
        <div className="h-5 bg-gray-700 rounded w-1/6"></div>
        <div className="h-16 bg-gray-700/50 rounded"></div>
      </div>
    ))}
  </div>
);

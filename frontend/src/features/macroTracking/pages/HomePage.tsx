import {
  useLoaderData,
  useNavigate,
  useRouterState,
  useSearch,
} from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { memo, useCallback, useEffect } from "react";

import { homeRoute } from "@/AppRouter";
import { CardContainer } from "@/components/form";
import Navbar from "@/components/layout/Navbar";
import { UserMetricsPanel } from "@/features/dashboard/components";
import {
  AddEntryForm,
  DailySummaryPanel,
  EditModal,
  EntryHistoryPanel,
} from "@/features/macroTracking/components";
import { FloatingNotification } from "@/features/notifications/components";
import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

export default function HomePage() {
  // Get user data from useUser hook
  const { data: user } = useUser();
  // Get macro data from home route loader
  const {
    macroTarget,
    macroDailyTotals = {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    },
    history = [],
    historyHasMore = false,
    weightGoals,
    weightLog,
    weightGoalsError,
  } = useLoaderData({ from: homeRoute.id }) as any;

  // Get state and actions from our store (excluding user)
  const {
    nutritionProfile,
    // weightGoals, // now hydrated from loader
    isLoading,
    isSaving,
    isEditing,
    isDeleting,
    error,
    notifications,
    editingEntry,
    setWeightGoals,
    addEntry,
    updateEntry,
    deleteEntry,
    setEditingEntry,
    hideNotification,
    clearAllNotifications,
    setNutritionProfile,
    setSubscriptionStatus,
  } = useStore();
  // Hydrate nutritionProfile from loader user object
  useEffect(() => {
    if (
      user &&
      typeof user.id === "number" &&
      typeof user.bmr === "number" &&
      typeof user.tdee === "number"
    ) {
      setNutritionProfile({ userId: user.id, bmr: user.bmr, tdee: user.tdee });
    }
  }, [user, setNutritionProfile]);

  // Debug: Log when HomePage renders and when useEffect runs
  console.log("[HomePage] Rendered", {
    user,
    macroTarget,
    macroDailyTotals,
    history,
  });

  // Hydrate nutritionProfile and subscriptionStatus from loader user object
  useEffect(() => {
    if (user && typeof user.id === "number") {
      // Compute nutritionProfile if not present
      let nutritionProfile;
      if (typeof user.bmr === "number" && typeof user.tdee === "number") {
        nutritionProfile = { userId: user.id, bmr: user.bmr, tdee: user.tdee };
      } else {
        try {
          nutritionProfile = createNutritionProfile(user);
        } catch {
          nutritionProfile = undefined;
        }
      }
      setNutritionProfile(nutritionProfile);
      if (user.subscription && typeof user.subscription.status === "string") {
        setSubscriptionStatus(user.subscription.status);
      }
    }
  }, [user, setNutritionProfile, setSubscriptionStatus]);

  // Handler for editing entries that matches EditModal's expected signature
  const handleEditEntry = useCallback(
    async (entry: typeof editingEntry) => {
      if (!entry) return;
      console.log("Editing entry:", entry);
      await updateEntry(entry.id, {
        protein: entry.protein,
        carbs: entry.carbs,
        fats: entry.fats,
        mealType: entry.mealType,
        mealName: entry.mealName,
        entryDate: entry.entryDate || "",
        entryTime: entry.entryTime || "",
      });
    },
    [updateEntry],
  );

  // Memoized close handler to prevent unnecessary re-renders
  const handleCloseModal = useCallback(() => {
    setEditingEntry(undefined);
  }, [setEditingEntry]);

  // Hydrate weight goals from loader into Zustand store
  useEffect(() => {
    setWeightGoals(weightGoals);
  }, [weightGoals, setWeightGoals]);

  // Debug effect to track editingEntry changes
  useEffect(() => {
    console.log("EditingEntry changed:", editingEntry);
  }, [editingEntry]);

  // Get the latest notification
  const latestNotification = notifications?.[notifications.length - 1];

  // Determine the calorie target - prioritize weight goals target if available, otherwise use TDEE
  // Use macroData from loader for history and macroDailyTotals

  // All macro data now comes directly from loader
  // Add TanStack Router hooks for navigation and search params
  const navigate = useNavigate({ from: homeRoute.id });
  const search = useSearch({ from: homeRoute.id });

  // Loader-based pagination
  const loadMoreHistory = useCallback(() => {
    const currentOffset = Number(search.offset) || 0;
    const currentLimit = Number(search.limit) || 20;
    const newOffset = currentOffset + currentLimit;
    navigate({
      search: {
        ...search,
        offset: newOffset,
        limit: currentLimit,
      },
      replace: false,
    });
  }, [navigate, search]);

  // Loading indicator for "Load More" button
  const isLoadingMore = useRouterState({
    select: (s) =>
      s.status === "pending" &&
      s.location.pathname === "/home" &&
      s.location.search.offset !== search.offset,
  });

  const effectiveCalorieTarget =
    weightGoals?.calorieTarget || nutritionProfile?.tdee;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />

      {/* Notification system */}
      {latestNotification && (
        <FloatingNotification
          message={latestNotification.message}
          type={latestNotification.type}
          onClose={() => hideNotification(latestNotification.id)}
          duration={latestNotification.duration}
        />
      )}

      {error && (
        <FloatingNotification
          message={error}
          type="error"
          onClose={clearAllNotifications}
          duration={5000}
        />
      )}

      <div className="relative min-h-screen ">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <PageHeader firstName={user?.firstName} isLoading={isLoading} />

          <div className="mb-8">
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
                    <AddEntryForm onSubmit={addEntry} isSaving={isSaving} />
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
                  deleteEntry={deleteEntry}
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
        </div>
      </div>

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
  );
}

// Extracted components for better organization
interface PageHeaderProps {
  firstName?: string;
  isLoading: boolean;
}
function PageHeader({ firstName, isLoading }: PageHeaderProps) {
  return (
    <div className="mb-6">
      {" "}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {" "}
        <h1 className="text-3xl sm:text-4xl font-medium bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text flex items-baseline">
          {" "}
          Welcome back,{" "}
          <span className="font-bold bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text ml-1.5">
            {" "}
            {isLoading ? "..." : firstName || "User"}{" "}
          </span>{" "}
        </h1>{" "}
        <div className="flex md:ml-auto">
          {" "}
          <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
            {" "}
            {new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}{" "}
          </span>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
const MemoizedPageHeader = memo(PageHeader);
MemoizedPageHeader.displayName = "PageHeader";
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

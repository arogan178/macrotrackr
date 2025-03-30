import { useEffect, memo } from "react";
import { Navbar } from "@/features/layout/components";
import { FloatingNotification } from "@/features/notifications/components";
import { CardContainer } from "@/components/form";
import {
  EntryHistoryPanel,
  DailySummaryPanel,
  AddEntryForm,
  EditModal,
} from "@/features/macroTracking/components";
import { UserMetricsPanel } from "@/features/dashboard/components";
import { useStore } from "@/store/store";

export default function HomePage() {
  // Get state and actions from our store
  const {
    user,
    nutritionProfile,
    history,
    macroDailyTotals,
    isLoading,
    isSaving,
    isEditing,
    isDeleting,
    error,
    notifications,
    editingEntry,
    fetchUserDetails,
    fetchMacroData,
    addEntry,
    updateEntry,
    deleteEntry,
    setEditingEntry,
    hideNotification,
    clearAllNotifications,
  } = useStore();

  // Fetch user details and macros on component mount
  useEffect(() => {
    fetchUserDetails();
    fetchMacroData();
  }, [fetchUserDetails, fetchMacroData]);

  // Get the latest notification
  const latestNotification = notifications?.[notifications.length - 1];

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
          <PageHeader firstName={user?.first_name} isLoading={isLoading} />

          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <div className="lg:col-span-4 flex flex-col h-full space-y-6">
                {/* Metrics Panel */}
                <UserMetricsPanel
                  bmr={nutritionProfile?.bmr}
                  tdee={nutritionProfile?.tdee}
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
                      macroDistribution={nutritionProfile?.macro_distribution}
                      targetCalories={nutritionProfile?.target_calories}
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
                />
              )}
            </div>
          </CardContainer>
        </div>
      </div>

      {/* Edit Modal - Only render when editingEntry is not null */}
      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onSave={updateEntry}
          onClose={() => setEditingEntry(null)}
          isSaving={isEditing}
        />
      )}
    </div>
  );
}

// Extracted components for better organization
const PageHeader = memo(
  ({ firstName, isLoading }: { firstName?: string; isLoading: boolean }) => (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-medium bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text flex items-baseline">
          Welcome back,
          <span className="font-bold bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text ml-1.5">
            {isLoading ? "..." : firstName || "User"}
          </span>
        </h1>
        <div className="flex md:ml-auto">
          <span className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-300 text-sm font-medium">
            {new Date().toLocaleDateString("en-US", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  )
);

// Loading skeleton components
const AddEntryLoadingSkeleton = () => (
  <CardContainer>
    <div className="p-5 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-8 bg-gray-700 rounded"></div>
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
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-12 bg-gray-700 rounded"></div>
        ))}
      </div>
    </div>
  </CardContainer>
);

const HistoryLoadingSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
    {[0, 1, 2].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-5 bg-gray-700 rounded w-1/6"></div>
        <div className="h-16 bg-gray-700/50 rounded"></div>
      </div>
    ))}
  </div>
);

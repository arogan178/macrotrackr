import { useEffect } from "react";
import EntryHistory from "../components/EntryHistory";
import EditModal from "../components/EditModal";
import Navbar from "../components/Navbar";
import DailySummary from "../components/DailySummary";
import AddEntry from "../components/AddEntry";
import FloatingNotification from "../components/FloatingNotification";
import CardMetricsPanel from "../components/CardMetricsPanel";
import { useAppState } from "../store/app-state";

export default function Overview() {
  // Get state and actions from our store
  const {
    user,
    history,
    totals,
    isLoading,
    isSaving,
    isEditing,
    isDeleting,
    error,
    notification,
    editingEntry,
    userMetrics,
    fetchUserDetails,
    addEntry,
    updateEntry,
    deleteEntry,
    setEditingEntry,
    clearNotification,
    clearError
  } = useAppState();

  // Fetch user details on component mount
  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      {/* Notification system */}
      {notification && (
        <FloatingNotification 
          message={notification} 
          type="success" 
          onClose={clearNotification} 
        />
      )}
      
      {error && (
        <FloatingNotification 
          message={error} 
          type="error" 
          onClose={clearError} 
        />
      )}
      
      <div className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(67,56,202,0.1),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="mb-6">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-medium bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text flex items-baseline">
                Welcome back,
                <span className="font-bold bg-gradient-to-r from-white to-indigo-200 text-transparent bg-clip-text ml-1.5">
                  {isLoading ? '...' : user?.first_name || 'User'}
                </span>
              </h1>
              <div className="flex md:ml-auto">
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-lg border border-gray-700/50 px-4 py-2 flex items-center gap-3">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-300">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
              <div className="lg:col-span-4 flex flex-col h-full">
                {/* Use the metrics component */}
                <CardMetricsPanel 
                  bmr={userMetrics.bmr} 
                  tdee={userMetrics.tdee} 
                  isLoading={isLoading} 
                />

                <div className="flex-1">
                  {isLoading ? (
                    <div className="flex-1 bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="grid grid-cols-3 gap-4">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-8 bg-gray-700 rounded"></div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <AddEntry onSubmit={addEntry} isSaving={isSaving} />
                  )}
                </div>
              </div>

              {/* Today's Summary - Right side */}
              <div className="lg:col-span-2 flex flex-col h-full">
                {isLoading ? (
                  <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl h-full animate-pulse">
                    <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="space-y-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-12 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                ) : (
                  user && (
                    <DailySummary
                      totals={totals} 
                      macroDistribution={user?.macro_distribution}
                    />
                  )
                )}
              </div>
            </div>
          </div>

          {/* History Section */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden">
            <div className="p-6">
              {isLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-700 rounded w-1/4 mb-6"></div>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-5 bg-gray-700 rounded w-1/6"></div>
                      <div className="h-16 bg-gray-700/50 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <EntryHistory
                  history={history}
                  deleteEntry={deleteEntry}
                  onEdit={setEditingEntry}
                  isDeleting={isDeleting}
                  isEditing={isEditing}
                />
              )}
            </div>
          </div>
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

import { useState, useEffect, useCallback, useMemo } from "react";
import EntryHistory from "../components/EntryHistory";
import EditModal from "../components/EditModal";
import { MacroEntry, MacroTotals, UserDetails } from "../types";
import Navbar from "../components/Navbar";
import { calculateBMR, calculateTDEE } from "../utils/calculations";
import DailySummary from "../components/DailySummary";
import AddEntry from "../components/AddEntry";
import FloatingNotification from "../components/FloatingNotification";
import { apiService } from "../utils/api-service";
import CardMetricsPanel from "../components/CardMetricsPanel";

export default function Overview() {
  // State management
  const [totals, setTotals] = useState<MacroTotals>({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });

  const [history, setHistory] = useState<MacroEntry[]>([]);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MacroEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Fetch user details on component mount
  useEffect(() => {
    fetchUserDetails();
  }, []);

  // API interactions
  const fetchUserDetails = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const userData = await apiService.user.getProfile();
      setUser(userData);
      await fetchMacros();
    } catch (error) {
      console.error("Fetch user error:", error);
      setError(error instanceof Error ? error.message : "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMacros = async () => {
    try {
      const [totalsData, historyData] = await Promise.all([
        apiService.macros.getDailyTotals(),
        apiService.macros.getHistory(),
      ]);
      
      setTotals(totalsData);
      setHistory(historyData);
    } catch (error) {
      console.error("Fetch macros error:", error);
      setError(error instanceof Error ? error.message : "Failed to load nutrition data");
    }
  };

  // Event handlers
  const handleSubmit = useCallback(async (inputs: { protein: number; carbs: number; fats: number }) => {
    setIsSaving(true);
    setError(null);

    try {
      await apiService.macros.addEntry(inputs);
      await fetchMacros();
      setNotification("Entry saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      setError(error instanceof Error ? error.message : "Failed to save macro entry");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const deleteEntry = useCallback(async (id: number) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // Optimistic UI update - store the entry before deletion
      const deletedEntry = history.find((entry) => entry.id === id);
      const today = new Date().toDateString();
      
      // Update UI immediately
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
      
      if (
        deletedEntry &&
        new Date(deletedEntry.created_at).toDateString() === today
      ) {
        setTotals((prev) => ({
          protein: prev.protein - deletedEntry.protein,
          carbs: prev.carbs - deletedEntry.carbs,
          fats: prev.fats - deletedEntry.fats,
          calories:
            prev.calories -
            (deletedEntry.protein * 4 +
              deletedEntry.carbs * 4 +
              deletedEntry.fats * 9),
        }));
      }
      
      // Make the API call
      await apiService.macros.deleteEntry(id);
      setNotification("Entry deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      setError(error instanceof Error ? error.message : "Failed to delete entry");
      
      // If there was an error, refresh data to restore state
      fetchMacros();
    } finally {
      setIsDeleting(false);
    }
  }, [history]);

  const handleEdit = useCallback(async (updatedEntry: MacroEntry) => {
    setIsEditing(true);
    setError(null);
    
    try {
      const { id, protein, carbs, fats } = updatedEntry;
      await apiService.macros.updateEntry(id, { protein, carbs, fats });
      
      setEditingEntry(null);
      await fetchMacros();
      setNotification("Entry updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      setError(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsEditing(false);
    }
  }, []);

  // Computed values
  const userMetrics = useMemo(() => {
    if (!user?.weight || !user?.height || !user?.date_of_birth || !user?.gender || !user?.activity_level) {
      return { bmr: 0, tdee: 0 };
    }

    const age = new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
    const bmr = Math.round(calculateBMR(user.weight, user.height, age, user.gender));
    const tdee = calculateTDEE(bmr, user.activity_level);

    return { bmr, tdee };
  }, [user]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      
      {/* Notification system */}
      {notification && (
        <FloatingNotification 
          message={notification} 
          type="success" 
          onClose={() => setNotification(null)} 
        />
      )}
      
      {error && (
        <FloatingNotification 
          message={error} 
          type="error" 
          onClose={() => setError(null)} 
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
                    <AddEntry onSubmit={handleSubmit} isSaving={isSaving} />
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
          onSave={handleEdit}
          onClose={() => setEditingEntry(null)}
          isSaving={isEditing}
        />
      )}
    </div>
  );
}

import { useState, useEffect, useCallback, useMemo } from "react";
import EntryHistory from "../components/EntryHistory";
import EditModal from "../components/EditModal";
import { MacroEntry, MacroTotals, UserDetails } from "../types";
import Navbar from "../components/Navbar";
import { calculateBMR, calculateTDEE } from "../utils/calculations";
import DailySummary from "../components/DailySummary";
import AddEntry from "../components/AddEntry";
import FloatingNotification from "../components/FloatingNotification";

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
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          throw new Error("Session expired. Please login again.");
        }
        throw new Error(`Failed to load profile: ${response.statusText}`);
      }

      const userData = await response.json();
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
      const [totalsResponse, historyResponse] = await Promise.all([
        fetch("http://localhost:3000/api/macro_entry", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
        fetch("http://localhost:3000/api/macros/history", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }),
      ]);

      if (!totalsResponse.ok) {
        throw new Error(`Failed to load totals: ${totalsResponse.statusText}`);
      }
      
      if (!historyResponse.ok) {
        throw new Error(`Failed to load history: ${historyResponse.statusText}`);
      }

      const totalsData = await totalsResponse.json();
      const historyData = await historyResponse.json();
      
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
      const response = await fetch("http://localhost:3000/api/macro_entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(inputs),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to save entry" }));
        throw new Error(errorData.message || "Failed to save entry");
      }
      
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
      const response = await fetch(
        `http://localhost:3000/api/macro_entry/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Delete failed" }));
        throw new Error(errorData.message || "Failed to delete entry");
      }

      // Optimistic UI update
      const deletedEntry = history.find((entry) => entry.id === id);
      const today = new Date().toDateString();

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

      setNotification("Entry deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      setError(error instanceof Error ? error.message : "Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  }, [history]);

  const handleEdit = useCallback(async (updatedEntry: MacroEntry) => {
    setIsEditing(true);
    setError(null);
    
    try {
      const response = await fetch(
        `http://localhost:3000/api/macro_entry/${updatedEntry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updatedEntry),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Update failed" }));
        throw new Error(errorData.message || "Failed to update entry");
      }

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

          {/* Loading Skeleton */}
          {isLoading ? (
            <div className="mb-8 animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                <div className="lg:col-span-4 flex flex-col h-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {[0, 1].map((i) => (
                      <div key={i} className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl">
                        <div className="flex items-start gap-5">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
                            <div className="h-7 w-7 bg-gray-700 rounded"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                            <div className="h-7 bg-gray-700 rounded w-2/5"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl">
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="grid grid-cols-3 gap-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-8 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 flex flex-col">
                  <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl h-full">
                    <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="space-y-4">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-12 bg-gray-700 rounded"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            user && (
              <div className="mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
                  <div className="lg:col-span-4 flex flex-col h-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {/* BMR Panel */}
                      <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
                        <div className="flex items-start gap-5">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 border border-indigo-500/20">
                            <svg className="h-7 w-7 text-indigo-400 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <h3 className="font-medium text-gray-400 text-sm truncate">Basal Metabolic Rate</h3>
                              <span className="text-xs text-indigo-400/80 whitespace-nowrap">(BMR)</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {userMetrics.bmr ? (
                                <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                                  {userMetrics.bmr} <span className="text-lg font-medium">kcal</span>
                                </span>
                              ) : (
                                <span className="text-gray-500 text-lg">Complete profile</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* TDEE Panel */}
                      <div className="bg-gray-800/70 backdrop-blur-sm p-5 rounded-2xl border border-gray-700/50 shadow-xl hover:bg-gray-800/80 transition-colors group">
                        <div className="flex items-start gap-5">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 border border-blue-500/20">
                            <svg className="h-7 w-7 text-blue-400 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.519 4.674c.3.921-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.519-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2 mb-1">
                              <h3 className="font-medium text-gray-400 text-sm truncate">Total Daily Energy</h3>
                              <span className="text-xs text-blue-400/80 whitespace-nowrap">(TDEE)</span>
                            </div>
                            <p className="text-2xl font-bold text-white">
                              {userMetrics.tdee ? (
                                <span className="bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                                  {userMetrics.tdee} <span className="text-lg font-medium">kcal</span>
                                </span>
                              ) : (
                                <span className="text-gray-500 text-lg">Complete profile</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1">
                      <AddEntry onSubmit={handleSubmit} isSaving={isSaving} />
                    </div>
                  </div>

                  {/* Today's Summary - Right side */}
                  <div className="lg:col-span-2 flex flex-col h-full">
                    <DailySummary
                      totals={totals} 
                      macroDistribution={user?.macro_distribution}
                    />
                  </div>
                </div>
              </div>
            )
          )}

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

import { useState, useEffect } from "react";
import MacroPieChart from "../components/MacroPieChart";
import EntryTable from "../components/EntryTable";
import EditModal from "../components/EditModal";
import { MacroEntry, MacroTotals, MacroInputs, UserDetails } from "../types";
import { getActivityLevelLabel } from "../utils/activityLevels";
import Navbar from "../components/Navbar";
import CalorieSearch from "../components/CalorieSearch";
import { calculateBMR, calculateTDEE } from "../utils/calculations";

export default function Overview() {
  const [inputs, setInputs] = useState<MacroInputs>({
    protein: "",
    carbs: "",
    fats: "",
  });

  const [totals, setTotals] = useState<MacroTotals>({
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  });

  const [history, setHistory] = useState<MacroEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MacroEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserDetails = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/user/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        throw new Error("Failed to load user: " + response.statusText);
      }

      const userData = await response.json();
      setUser(userData);
      fetchMacros();
    } catch (error) {
      console.error("Fetch user error:", error);
      setError("Failed to load user details. Please try again later.");
    }
  };

  const fetchMacros = async () => {
    try {
      setError(null);
      // Updated URL and added Authorization header
      const totalsResponse = await fetch(
        "http://localhost:3000/api/macro_entry",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!totalsResponse.ok) {
        throw new Error("Failed to load totals: " + totalsResponse.statusText);
      }

      const totalsData = await totalsResponse.json();
      setTotals(totalsData);

      // Updated history fetch URL and header
      const historyResponse = await fetch(
        "http://localhost:3000/api/macros/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!historyResponse.ok) {
        throw new Error(
          "Failed to load history: " + historyResponse.statusText
        );
      }

      const historyData = await historyResponse.json();
      setHistory(historyData);
    } catch (error) {
      console.error("Fetch macros error:", error);
      setError(error instanceof Error ? error.message : "Failed to load data");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await fetch("http://localhost:3000/api/macro_entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`, // Added header
        },
        body: JSON.stringify({
          protein: Number(inputs.protein),
          carbs: Number(inputs.carbs),
          fats: Number(inputs.fats),
        }),
      });

      if (!response.ok) throw new Error("Failed to save");

      setInputs({ protein: "", carbs: "", fats: "" });
      fetchMacros();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save macro entry. Please try again later.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEntry = async (id: number) => {
    setIsDeleting(true);
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
      if (!response.ok) throw new Error("Failed to delete");

      // Determine if deleted entry is from today
      const deletedEntry = history.find((entry) => entry.id === id);
      const today = new Date().toDateString();

      // Update history state directly
      setHistory((prev) => prev.filter((entry) => entry.id !== id));

      if (
        deletedEntry &&
        new Date(deletedEntry.created_at).toDateString() === today
      ) {
        // Adjust totals by subtracting deleted macros
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
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete entry. Please try again later.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = async (updatedEntry: MacroEntry) => {
    setIsEditing(true);
    try {
      // Updated PUT call to include Authorization header
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
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      setEditingEntry(null);
      fetchMacros();
    } catch (error) {
      console.error("Update error:", error);
      alert(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsEditing(false);
    }
  };

  const calculateUserMetrics = () => {
    if (!user?.weight || !user?.height || !user?.date_of_birth || !user?.gender || !user?.activity_level) {
      return { bmr: 0, tdee: 0 };
    }

    const age = new Date().getFullYear() - new Date(user.date_of_birth).getFullYear();
    const bmr = Math.round(calculateBMR(user.weight, user.height, age, user.gender));
    const tdee = calculateTDEE(bmr, user.activity_level);

    return { bmr, tdee };
  };

  const { bmr, tdee } = calculateUserMetrics();

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span>
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">{user?.first_name || "User"}</span>
              </span>
            </h1>
            
            {tdee > 0 && (
              <div className="mt-2 sm:mt-0 text-sm px-4 py-2 bg-blue-900/30 border border-blue-800 rounded-lg text-blue-300 flex items-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Your daily goal: {tdee} kcal
              </div>
            )}
          </div>
          
          {user && (
            <>
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-800/60 rounded-xl shadow-lg border border-gray-700 backdrop-blur-sm overflow-hidden">
                <div className="p-4 sm:p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      onClick={() => navigate('/settings')}
                      className="text-sm px-3 py-1.5 bg-gray-700/80 text-gray-300 rounded-md hover:bg-gray-600/80 transition-colors flex items-center shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit Profile
                    </button>
                  </div>
                
                  <h2 className="text-xl font-semibold text-gray-100 mb-5 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Your Profile
                  </h2>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <span className="text-gray-400 text-sm">Height</span>
                      <p className="text-xl font-semibold text-gray-100 flex items-end gap-1">
                        {user.height ? user.height : '–'}
                        {user.height && <span className="text-gray-400 text-sm mb-0.5">cm</span>}
                      </p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <span className="text-gray-400 text-sm">Weight</span>
                      <p className="text-xl font-semibold text-gray-100 flex items-end gap-1">
                        {user.weight ? user.weight : '–'}
                        {user.weight && <span className="text-gray-400 text-sm mb-0.5">kg</span>}
                      </p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <span className="text-gray-400 text-sm">Activity Level</span>
                      <p className="text-lg font-semibold text-gray-100">
                        {user.activity_level ? getActivityLevelLabel(user.activity_level) : '–'}
                      </p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <span className="text-gray-400 text-sm">Age</span>
                      <p className="text-xl font-semibold text-gray-100 flex items-end gap-1">
                        {user.date_of_birth
                          ? new Date().getFullYear() - new Date(user.date_of_birth).getFullYear()
                          : "–"}
                        {user.date_of_birth && <span className="text-gray-400 text-sm mb-0.5">years</span>}
                      </p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <span className="text-gray-400 text-sm">Gender</span>
                      <p className="text-xl font-semibold text-gray-100">
                        {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : "–"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                    <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        <div>
                          <h3 className="font-semibold text-gray-300">Basal Metabolic Rate (BMR)</h3>
                          <p className="text-xs text-gray-500">Calories burned at complete rest</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-100 flex items-end">
                        {bmr ? `${bmr}` : '–'}
                        {bmr ? <span className="text-gray-400 text-sm ml-1 mb-1">kcal / day</span> : ''}
                      </p>
                    </div>
                    
                    <div className="bg-gray-900/50 p-5 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors scale-transition">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                        <div>
                          <h3 className="font-semibold text-gray-300">Total Daily Energy Expenditure</h3>
                          <p className="text-xs text-gray-500">Total daily calories burned with activity</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-100 flex items-end">
                        {tdee ? `${tdee}` : '–'}
                        {tdee ? <span className="text-gray-400 text-sm ml-1 mb-1">kcal / day</span> : ''}
                      </p>
                    </div>
                  </div>
                </div>
                
                {(!user.weight || !user.height || !user.date_of_birth || !user.gender || !user.activity_level) && (
                  <div className="bg-blue-900/30 border-t border-blue-800 px-6 py-3 flex items-center text-sm text-blue-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Complete your profile in settings to get accurate BMR and TDEE calculations
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <CalorieSearch
          onResult={(result: MacroInputs) =>
            setInputs({
              protein: Math.round(Number(result.protein)).toString(),
              carbs: Math.round(Number(result.carbs)).toString(),
              fats: Math.round(Number(result.fats)).toString(),
            })
          }
        />
        
        <div className="bg-gray-800/80 p-6 rounded-xl border border-gray-700 shadow-md backdrop-blur-sm mt-6 animate-fade-in">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-200">Add New Entry</h3>
          </div>
          
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label htmlFor="protein" className="block text-sm font-medium text-gray-300">Protein (g)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-red-500 opacity-75"></div>
                  </div>
                  <input
                    id="protein"
                    className="pl-10 w-full py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*[.]?[0-9]*"
                    placeholder="0"
                    value={inputs.protein}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      if (/^[0-9]*[.]?[0-9]*$/.test(e.target.value) || e.target.value === '') {
                        setInputs((v: MacroInputs) => ({
                          ...v,
                          protein: e.target.value,
                        }))
                      }
                    }}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm text-gray-500">g</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="carbs" className="block text-sm font-medium text-gray-300">Carbohydrates (g)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 opacity-75"></div>
                  </div>
                  <input
                    id="carbs"
                    className="pl-10 w-full py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*[.]?[0-9]*"
                    placeholder="0"
                    value={inputs.carbs}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      if (/^[0-9]*[.]?[0-9]*$/.test(e.target.value) || e.target.value === '') {
                        setInputs((v: MacroInputs) => ({
                          ...v,
                          carbs: e.target.value,
                        }))
                      }
                    }}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm text-gray-500">g</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="fats" className="block text-sm font-medium text-gray-300">Fats (g)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-75"></div>
                  </div>
                  <input
                    id="fats"
                    className="pl-10 w-full py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*[.]?[0-9]*"
                    placeholder="0"
                    value={inputs.fats}
                    onChange={(e) => {
                      // Only allow numbers and decimal points
                      if (/^[0-9]*[.]?[0-9]*$/.test(e.target.value) || e.target.value === '') {
                        setInputs((v: MacroInputs) => ({
                          ...v,
                          fats: e.target.value,
                        }))
                      }
                    }}
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-sm text-gray-500">g</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div className="text-gray-400 text-sm">
                {(Number(inputs.protein) || Number(inputs.carbs) || Number(inputs.fats)) ? (
                  <span>
                    Estimated calories: <span className="text-white font-medium">
                      {Math.round(
                        Number(inputs.protein) * 4 + 
                        Number(inputs.carbs) * 4 + 
                        Number(inputs.fats) * 9
                      )} kcal
                    </span>
                  </span>
                ) : ''}
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg flex items-center"
                disabled={isSaving || (!Number(inputs.protein) && !Number(inputs.carbs) && !Number(inputs.fats))}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Save Entry
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 animate-fade-in">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          </div>
        )}

        <div className="mt-6">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h2 className="text-xl font-bold text-gray-100">Today's Macros</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-all scale-transition">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <h3 className="font-semibold text-gray-300">Protein</h3>
              </div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-bold text-gray-100">{totals.protein}</span>
                <span className="text-gray-400 mb-0.5">g</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(totals.protein * 4)} calories</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-all scale-transition">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                <h3 className="font-semibold text-gray-300">Carbs</h3>
              </div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-bold text-gray-100">{totals.carbs}</span>
                <span className="text-gray-400 mb-0.5">g</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(totals.carbs * 4)} calories</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md hover:shadow-lg transition-all scale-transition">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <h3 className="font-semibold text-gray-300">Fats</h3>
              </div>
              <div className="flex items-end gap-1 mt-2">
                <span className="text-2xl font-bold text-gray-100">{totals.fats}</span>
                <span className="text-gray-400 mb-0.5">g</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{Math.round(totals.fats * 9)} calories</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-6 bg-gray-800/80 rounded-xl border border-gray-700 shadow-lg backdrop-blur-sm">
          <div className="flex items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="font-bold text-xl text-gray-100">Daily Calories</h3>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
            <p className="text-3xl sm:text-4xl font-bold text-white">{totals.calories} <span className="text-xl text-gray-400">kcal</span></p>
            
            {tdee > 0 && (
              <div className="ml-auto flex gap-2 items-center text-sm">
                <div className={`px-3 py-1 rounded-full flex items-center ${totals.calories < tdee ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {totals.calories < tdee ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      {tdee - totals.calories} kcal below TDEE
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      {totals.calories - tdee} kcal above TDEE
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <MacroPieChart totals={totals} />
        </div>

        <EntryTable
          history={history}
          deleteEntry={deleteEntry}
          onEdit={setEditingEntry}
          isDeleting={isDeleting}
          isEditing={isEditing}
        />
        {editingEntry && (
          <EditModal
            entry={editingEntry}
            onSave={handleEdit}
            onClose={() => setEditingEntry(null)}
            isSaving={isEditing}
          />
        )}
      </div>
    </div>
  );
}

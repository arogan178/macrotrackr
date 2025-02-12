import { useState, useEffect } from "react";
import MacroPieChart from "../components/MacroPieChart";
import EntryTable from "../components/EntryTable";
import EditModal from "../components/EditModal";
import { MacroEntry, MacroTotals, MacroInputs, UserDetails } from "../types";
import Navbar from "../components/Navbar";
import CalorieSearch from "../components/CalorieSearch";

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

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <div className="w-full p-2 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 flex justify-between text-gray-100">
          <span>
            Welcome Back {user?.full_name ? user.full_name.split(" ")[0] : ""}
          </span>
        </h1>
        <CalorieSearch
          onResult={(result: MacroInputs) =>
            setInputs({
              protein: Math.round(Number(result.protein)).toString(),
              carbs: Math.round(Number(result.carbs)).toString(),
              fats: Math.round(Number(result.fats)).toString(),
            })
          }
        />
        <form className="space-y-2" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="flex items-center justify-between sm:block">
              <label htmlFor="protein" className="text-gray-300">Protein (g):</label>
              <input
                id="protein"
                className="border rounded px-2 py-1 ml-2 w-20 sm:w-24 bg-gray-800 border-gray-600 text-gray-100"
                type="number"
                min="0"
                value={inputs.protein}
                onChange={(e) =>
                  setInputs((v: MacroInputs) => ({
                    ...v,
                    protein: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between sm:block">
              <label htmlFor="carbs" className="text-gray-300">Carbs (g):</label>
              <input
                id="carbs"
                className="border rounded px-2 py-1 ml-2 w-20 sm:w-24 bg-gray-800 border-gray-600 text-gray-100"
                type="number"
                min="0"
                value={inputs.carbs}
                onChange={(e) =>
                  setInputs((v: MacroInputs) => ({
                    ...v,
                    carbs: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between sm:block">
              <label htmlFor="fats" className="text-gray-300">Fats (g):</label>
              <input
                id="fats"
                className="border rounded px-2 py-1 ml-2 w-20 sm:w-24 bg-gray-800 border-gray-600 text-gray-100"
                type="number"
                min="0"
                value={inputs.fats}
                onChange={(e) =>
                  setInputs((v: MacroInputs) => ({
                    ...v,
                    fats: e.target.value,
                  }))
                }
              />
            </div>
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                disabled={isSaving || (!Number(inputs.protein) && !Number(inputs.carbs) && !Number(inputs.fats))}
              >
                {isSaving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-4 p-2 text-red-400 bg-red-900/50 rounded">
            {error}
          </div>
        )}

        <div className="mt-4">
          <h2 className="text-lg sm:text-xl font-bold text-gray-100">Today's Macros:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-300">Protein</h3>
              <p className="text-gray-100">{totals.protein}g</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-300">Carbs</h3>
              <p className="text-gray-100">{totals.carbs}g</p>
            </div>
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="font-semibold text-gray-300">Fats</h3>
              <p className="text-gray-100">{totals.fats}g</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <h3 className="font-bold text-lg text-gray-100">Calories</h3>
          <p className="text-xl sm:text-2xl text-gray-100">{totals.calories} kcal</p>
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

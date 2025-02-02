import { useState, useEffect } from "react";
import MacroPieChart from "../components/MacroPieChart";
import EntryTable from "../components/EntryTable";
import EditModal from "../components/EditModal";
import { MacroEntry, MacroTotals, MacroInputs, UserDetails } from "../types";

export default function Overview() {
  const [inputs, setInputs] = useState<MacroInputs>({
    protein: "",
    carbs: "",
    fats: "",
  });

  const [totals, setTotals] = useState<MacroTotals>({
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    calories: 0,
  });

  const [history, setHistory] = useState<MacroEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userID, setUserID] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [onEdit, setEditingEntry] = useState<MacroEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  useEffect(() => {
    if (userID) {
      fetchMacros(userID);
    }
  }, [userID]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login"; // Full page reload to clear state
  };

  const fetchUserDetails = async () => {
    setIsLoading(true);
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
    } catch (error) {
      console.error("Fetch user error:", error);
      setError("Failed to load user details. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMacros = async (userID: number) => {
    try {
      setError(null);

      const totalsResponse = await fetch(
        `http://localhost:3000/api/macro_entry/${userID}`
      );

      if (!totalsResponse.ok) {
        throw new Error("Failed to load totals: " + totalsResponse.statusText);
      }

      const totalsData = await totalsResponse.json();
      setTotals(totalsData);

      // fetch history
      const historyResponse = await fetch(
        `http://localhost:3000/api/macros/history/${userID}`
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

    if (userID === null) {
      alert("User not authenticated");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/macro_entry/${userID}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            protein: Number(inputs.protein),
            carbs: Number(inputs.carbs),
            fats: Number(inputs.fats),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to save");

      setInputs({ protein: "", carbs: "", fats: "" });
      fetchMacros(userID);
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
      if (userID === null) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `http://localhost:3000/api/macro_entry/${id}`,
        { method: "DELETE" }
      );

      if (!response.ok) throw new Error("Failed to delete");
      fetchMacros(userID);
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
      if (!userID) {
        throw new Error("User not authenticated");
      }

      const response = await fetch(
        `http://localhost:3000/api/macro_entry/${updatedEntry.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedEntry),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Update failed");
      }

      setEditingEntry(null);
      fetchMacros(userID);
    } catch (error) {
      console.error("Update error:", error);
      alert(error instanceof Error ? error.message : "Failed to update entry");
    } finally {
      setIsEditing(false);
    }
  };

  const exportCSV = () => {
    const csvContent = [
      "Date, Time, Protein (g), Carbs (g), Fats (g), Calories",
      ...history
        .map(
          (entry) =>
            `${new Date(entry.created_at).toLocaleDateString()},${new Date(
              entry.created_at
            ).toLocaleTimeString()},${entry.protein},${entry.carbs},${
              entry.fats
            },${entry.protein * 4 + entry.carbs * 4 + entry.fats * 9}`
        )
        .join("\n"),
    ];

    const blob = new Blob([csvContent.join("\n")], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "macro-entries.csv";
    a.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-2 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 flex justify-between">
        <span>
          Welcome Back {user?.full_name ? user.full_name.split(" ")[0] : ""}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Logout
        </button>
      </h1>
      <form className="space-y-2" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Protein input */}
          <div className="flex items-center justify-between sm:block">
            <label htmlFor="protein">Protein (g):</label>
            <input
              id="protein"
              className="border rounded px-2 py-1 ml-2 w-20 sm:w-24"
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
          {/* Carbs Input */}
          <div className="flex items-center justify-between sm:block">
            <label htmlFor="carbs">Carbs (g):</label>
            <input
              id="carbs"
              className="border rounded px-2 py-1 ml-2 w-20 sm:w-24"
              type="number"
              min="0"
              value={inputs.carbs}
              onChange={(e) =>
                setInputs((v: MacroInputs) => ({ ...v, carbs: e.target.value }))
              }
            />
          </div>
          {/* Fats Input */}
          <div className="flex items-center justify-between sm:block">
            <label htmlFor="fats">Fats (g):</label>
            <input
              id="fats"
              className="border rounded px-2 py-1 ml-2 w-20 sm:w-24"
              type="number"
              min="0"
              value={inputs.fats}
              onChange={(e) =>
                setInputs((v: MacroInputs) => ({ ...v, fats: e.target.value }))
              }
            />
          </div>
          <div className="flex items-end justify-between sm:block">
            <button
              type="submit"
              className="w-full sm:w-auto bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-2 text-red-700 bg-red-100 rounded">{error}</div>
      )}

      <div className="mt-4">
        <h2 className="text-lg sm:text-xl font-bold">Today's Macros:</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mt-2">
          <div className="bg-gray-100 p-2 rounded">
            <h3 className="font-semibold">Protein</h3>
            <p>{totals.total_protein}g</p>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <h3 className="font-semibold">Carbs</h3>
            <p>{totals.total_carbs}g</p>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <h3 className="font-semibold">Fats</h3>
            <p>{totals.total_fats}g</p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-blue-50 rounded">
        <h3 className="font-bold text-lg">Calories</h3>
        <p className="text-xl sm:text-2xl">{totals.calories} kcal</p>
        <MacroPieChart totals={totals} />
      </div>
      <EntryTable
        history={history}
        deleteEntry={deleteEntry}
        onEdit={setEditingEntry}
        isDeleting={isDeleting}
        isEditing={isEditing}
      />
      <div className="flex justify-end mt-4">
        <button
          onClick={exportCSV}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Export CSV
        </button>
      </div>
      {onEdit && (
        <EditModal
          entry={onEdit}
          onSave={handleEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

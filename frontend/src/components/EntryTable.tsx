import { MacroEntry } from "../types";
import { useEffect, useState, Fragment } from "react";

interface EntryTableProps {
  history: MacroEntry[];
  deleteEntry: (id: number) => void;
  onEdit: (entry: MacroEntry) => void;
  isDeleting: boolean;
  isEditing: boolean;
}

interface GroupedEntries {
  date: string;
  entries: MacroEntry[];
}

const exportCSV = (history: MacroEntry[]) => {
  const csvContent = [
    "Date, Time, Protein (g), Carbs (g), Fats (g), Calories",
    history
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

export default function EntryTable({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
}: EntryTableProps) {
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([]);

  useEffect(() => {
    const grouped = history.reduce((acc, entry) => {
      const entryDate = new Date(entry.created_at);
      const dateKey = entryDate.toLocaleDateString("en-UK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, MacroEntry[]>);

    const groupedArray = Object.entries(grouped).map(([date, entries]) => ({
      date,
      entries,
    }));

    setGroupedEntries(groupedArray);
  }, [history]);

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-100">Entry History</h2>
        {history.length > 0 && (
          <button
            onClick={() => exportCSV(history)}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="mt-8 text-center">
          <img
            src="/empty-state.svg"
            className="mx-auto h-32 w-32 opacity-50"
            alt="No entries"
          />
          <p className="mt-1 text-sm text-gray-400">
            Get started by logging your first meal
          </p>
        </div>
      ) : (
        <div className="rounded-lg overflow-x-auto border border-gray-700">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300">
                  Time
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300">
                  Protein
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300">
                  Carbs
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300">
                  Fats
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300">
                  Calories
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-400">
                    No entries yet. Add your first meal!
                  </td>
                </tr>
              ) : (
                groupedEntries.map((group) => (
                  <Fragment key={group.date}>
                    <tr className="bg-gray-800/50">
                      <td
                        colSpan={6}
                        className="px-4 py-2 font-semibold text-sm sm:text-base text-gray-300"
                      >
                        {group.date}
                      </td>
                    </tr>
                    {group.entries.map((entry) => (
                      <tr key={entry.id} className="bg-gray-800/20 hover:bg-gray-700/50 transition-colors">
                        <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300">
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-300">
                          {entry.protein}g
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-300">
                          {entry.carbs}g
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-300">
                          {entry.fats}g
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-300">
                          {entry.protein * 4 + entry.carbs * 4 + entry.fats * 9} kcal
                        </td>
                        <td className="px-2 sm:px-4 py-3 text-center">
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1 mr-2 rounded hover:bg-blue-600 transition-colors"
                            aria-label="Edit entry"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1 rounded hover:bg-red-600 transition-colors"
                            disabled={isDeleting}
                            aria-label="Delete entry"
                          >
                            {isDeleting ? "⏳" : "🗑️"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

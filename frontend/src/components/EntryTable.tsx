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

    // Sort by most recent date first
    groupedArray.sort((a, b) => {
      return new Date(b.entries[0].created_at).getTime() - 
             new Date(a.entries[0].created_at).getTime();
    });

    setGroupedEntries(groupedArray);
  }, [history]);

  return (
    <div className="mt-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Entry History
        </h2>
        {history.length > 0 && (
          <button
            onClick={() => exportCSV(history)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-md hover:shadow-lg flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <div className="mt-8 text-center p-10 bg-gray-800/30 rounded-lg border border-gray-700 animate-fade-in">
          <img
            src="/empty-state.svg"
            className="mx-auto h-32 w-32 opacity-50"
            alt="No entries"
          />
          <p className="mt-4 text-lg text-gray-300 font-medium">
            No entries yet
          </p>
          <p className="mt-1 text-sm text-gray-400">
            Get started by logging your first meal
          </p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden border border-gray-700 shadow-lg scale-transition bg-gray-800/50 backdrop-blur-sm">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Protein
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Carbs
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Fats
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Calories
                </th>
                <th className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {groupedEntries.map((group) => (
                <Fragment key={group.date}>
                  <tr className="bg-gray-800/80">
                    <td
                      colSpan={6}
                      className="px-4 py-2 font-semibold text-sm sm:text-base text-blue-400"
                    >
                      <div className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {group.date}
                      </div>
                    </td>
                  </tr>
                  {group.entries.map((entry) => (
                    <tr key={entry.id} className="bg-gray-800/30 hover:bg-gray-700/40 transition-colors">
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-300">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {new Date(entry.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium">
                        <span className="bg-red-900/20 text-red-400 py-1 px-2 rounded-md">
                          {entry.protein}g
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium">
                        <span className="bg-yellow-900/20 text-yellow-400 py-1 px-2 rounded-md">
                          {entry.carbs}g
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm font-medium">
                        <span className="bg-blue-900/20 text-blue-400 py-1 px-2 rounded-md">
                          {entry.fats}g
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center text-xs sm:text-sm text-gray-300 font-medium">
                        {entry.protein * 4 + entry.carbs * 4 + entry.fats * 9} kcal
                      </td>
                      <td className="px-2 sm:px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => onEdit(entry)}
                            className="p-1.5 rounded-full bg-gray-700 hover:bg-blue-600 transition-colors flex items-center justify-center"
                            aria-label="Edit entry"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-1.5 rounded-full bg-gray-700 hover:bg-red-600 transition-colors flex items-center justify-center"
                            disabled={isDeleting}
                            aria-label="Delete entry"
                          >
                            {isDeleting ? (
                              <svg className="animate-spin h-4 w-4 text-gray-200" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

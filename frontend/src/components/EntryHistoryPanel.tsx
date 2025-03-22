import { MacroEntry } from "../types";
import { useEffect, useState, Fragment } from "react";
import {
  ExportIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EditIcon,
  TrashIcon,
  LoadingSpinnerIcon,
  PlusCircleIcon,
} from "./Icons";

interface EntryHistoryProps {
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
          },${Math.round(entry.protein * 4 + entry.carbs * 4 + entry.fats * 9)}`
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

export default function EntryHistory({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
}: EntryHistoryProps) {
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([]);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

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

    // Set all dates as collapsed by default
    setCollapsedDates(new Set(groupedArray.map((group) => group.date)));
  }, [history]);

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates((prev) => {
      const newCollapsed = new Set(prev);
      if (newCollapsed.has(date)) {
        newCollapsed.delete(date);
      } else {
        newCollapsed.add(date);
      }
      return newCollapsed;
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Entry History</h2>
          <p className="text-sm text-gray-400 mt-1">
            {history.length} {history.length === 1 ? "entry" : "entries"} across{" "}
            {groupedEntries.length}{" "}
            {groupedEntries.length === 1 ? "day" : "days"}
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={() => exportCSV(history)}
            className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500/90 text-white text-sm font-medium rounded-lg flex items-center transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            <ExportIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-16 flex flex-col items-center justify-center bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/50">
          <div className="w-20 h-20 mb-4 rounded-full bg-gray-700/70 flex items-center justify-center">
            <PlusCircleIcon className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-300">No entries yet</h3>
          <p className="mt-2 text-sm text-gray-400 max-w-sm text-center">
            Get started by logging your first meal using the form above
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Time
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Protein
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Carbs
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Fats
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Calories
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedEntries.map((group) => (
                  <Fragment key={group.date}>
                    <tr
                      className="bg-indigo-600/10 border-t border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors group"
                      onClick={() => toggleDateCollapse(group.date)}
                    >
                      <td className="px-4 py-2.5 font-semibold text-indigo-300 text-sm">
                        <div className="flex items-center gap-2">
                          {collapsedDates.has(group.date) ? (
                            <ChevronDownIcon className="w-4 h-4 -rotate-90 transform transition-transform" />
                          ) : (
                            <ChevronDownIcon className="w-4 h-4 transform transition-transform" />
                          )}
                          {group.date}
                          <span className="text-xs text-indigo-400/70 font-normal">
                            ({group.entries.length}{" "}
                            {group.entries.length === 1 ? "entry" : "entries"})
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-green-400">
                        {group.entries.reduce(
                          (acc, entry) => acc + entry.protein,
                          0
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-blue-400">
                        {group.entries.reduce(
                          (acc, entry) => acc + entry.carbs,
                          0
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-red-400">
                        {group.entries.reduce(
                          (acc, entry) => acc + entry.fats,
                          0
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center font-semibold text-white">
                        {Math.round(
                          group.entries.reduce(
                            (acc, entry) =>
                              acc +
                              entry.protein * 4 +
                              entry.carbs * 4 +
                              entry.fats * 9,
                            0
                          )
                        )}{" "}
                        kcal
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronDownIcon
                            className={`w-4 h-4 transform transition-transform ${
                              collapsedDates.has(group.date) ? "-rotate-90" : ""
                            }`}
                          />
                        </div>
                      </td>
                    </tr>
                    {!collapsedDates.has(group.date) &&
                      group.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap pl-11">
                            {new Date(entry.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-green-400">
                            {entry.protein}g
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-blue-400">
                            {entry.carbs}g
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-red-400">
                            {entry.fats}g
                          </td>
                          <td className="px-4 py-3 text-center font-medium text-white">
                            {Math.round(
                              entry.protein * 4 +
                                entry.carbs * 4 +
                                entry.fats * 9
                            )}{" "}
                            kcal
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={() => onEdit(entry)}
                                className="p-1.5 rounded-md bg-blue-600/20 border border-blue-500/30 hover:bg-blue-500/30 text-blue-400 transition-colors"
                                aria-label="Edit entry"
                              >
                                <EditIcon className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteEntry(entry.id)}
                                className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors"
                                disabled={isDeleting}
                                aria-label="Delete entry"
                              >
                                {isDeleting ? (
                                  <LoadingSpinnerIcon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <TrashIcon className="w-4 h-4" />
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
        </div>
      )}
    </div>
  );
}

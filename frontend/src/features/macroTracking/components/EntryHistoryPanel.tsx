import { useEffect, useState, Fragment, useMemo, memo } from "react";
import {
  ExportIcon,
  ChevronDownIcon,
  EditIcon,
  TrashIcon,
  LoadingSpinnerIcon,
  PlusCircleIcon,
} from "@/components/Icons";
import Modal from "@/components/Modal";
import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { MacroEntry } from "../types";

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
    "Date, Time, Meal Type, Meal Name, Protein (g), Carbs (g), Fats (g), Calories",
    history
      .map(
        (entry) =>
          `${
            entry.entry_date || new Date(entry.created_at).toLocaleDateString()
          },${new Date(entry.created_at).toLocaleTimeString()},${
            entry.mealType || ""
          },${entry.foodName || entry.mealName || ""},${entry.protein},${
            entry.carbs
          },${entry.fats},${Math.round(
            entry.protein * 4 + entry.carbs * 4 + entry.fats * 9
          )}`
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

const EntryHistoryComponent = function EntryHistory({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
}: EntryHistoryProps) {
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([]);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());

  // Add state for confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  // Get today's date formatted like "27 Dec, 2023" for comparison
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-UK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Format a date string, replacing today's date with "Today"
  const formatDate = (dateString: string) => {
    return dateString === todayFormatted ? "Today" : dateString;
  };

  // Helper function to ensure dates are displayed in the correct timezone
  function formatEntryDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-UK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  // Helper function to format time consistently
  function formatTimeFromEntry(entry: MacroEntry): string {
    // First use entry_time if it exists
    if (entry.entry_time) {
      return entry.entry_time;
    }

    // Otherwise fall back to created_at timestamp
    const createdDate = new Date(entry.created_at);
    return createdDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }

  useEffect(() => {
    const grouped = history.reduce((acc, entry) => {
      // Always use entry_date if available, only fall back to created_at if missing
      const dateStr = entry.entry_date || entry.created_at;
      // Format date consistently using the helper
      const dateKey = formatEntryDate(dateStr);

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

    // Sort by date (newest first)
    groupedArray.sort((a, b) => {
      const dateA = new Date(
        a.entries[0].entry_date || a.entries[0].created_at
      );
      const dateB = new Date(
        b.entries[0].entry_date || b.entries[0].created_at
      );
      return dateB.getTime() - dateA.getTime();
    });

    setGroupedEntries(groupedArray);

    // Only reset collapsed dates if this is the initial load (collapsedDates is empty)
    // This preserves user's expanded/collapsed preferences during updates
    setCollapsedDates((prevCollapsed) => {
      // If no collapsed dates are set yet, set defaults
      if (prevCollapsed.size === 0) {
        const newCollapsedDates = new Set<string>();
        groupedArray.forEach((group) => {
          if (group.date !== todayFormatted) {
            newCollapsedDates.add(group.date);
          }
        });
        return newCollapsedDates;
      }

      // Otherwise, preserve existing collapsed state
      // But remove any dates that no longer exist in the data
      const existingDates = new Set(groupedArray.map((group) => group.date));
      const filteredCollapsed = new Set<string>();
      prevCollapsed.forEach((date) => {
        if (existingDates.has(date)) {
          filteredCollapsed.add(date);
        }
      });
      return filteredCollapsed;
    });
  }, [history, todayFormatted]);

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

  // Updated to open modal instead of using native confirm
  const handleDeleteDate = (date: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent toggling the collapse state
    setDateToDelete(date);
    setIsDeleteModalOpen(true);
  };

  // Handle confirmation from modal
  const confirmDeleteDate = () => {
    if (!dateToDelete) return;

    const group = groupedEntries.find((g) => g.date === dateToDelete);
    if (group) {
      group.entries.forEach((entry) => deleteEntry(entry.id));
    }

    // Close modal
    setIsDeleteModalOpen(false);
    setDateToDelete(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-100">Entry History</h2>{" "}
          <p className="text-sm text-gray-400 mt-1">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={groupedEntries.length} />{" "}
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
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Time
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Meal
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Protein
                    </div>
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Carbs
                    </div>
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    <div className="flex items-center justify-center gap-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      Fats
                    </div>
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
                    Calories
                  </th>
                  <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
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
                          {formatDate(group.date)}
                        </div>
                      </td>
                      {/* Use explicit widths to avoid shifting content */}
                      <td className="px-4 py-2.5"></td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-green-400">
                        {Math.round(
                          group.entries.reduce(
                            (acc, entry) => acc + (entry.protein || 0),
                            0
                          )
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-blue-400">
                        {Math.round(
                          group.entries.reduce(
                            (acc, entry) => acc + (entry.carbs || 0),
                            0
                          )
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-red-400">
                        {Math.round(
                          group.entries.reduce(
                            (acc, entry) => acc + (entry.fats || 0),
                            0
                          )
                        )}
                        g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-white">
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
                        <button
                          onClick={(e) => handleDeleteDate(group.date, e)}
                          className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                          aria-label={`Delete all entries for ${formatDate(
                            group.date
                          )}`}
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                    {!collapsedDates.has(group.date) &&
                      group.entries.map((entry) => (
                        <tr
                          key={entry.id}
                          className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap pl-11">
                            {formatTimeFromEntry(entry)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-300 text-center">
                            <div>
                              <span className="font-medium text-indigo-300">
                                {entry.mealType
                                  ? capitalizeFirstLetter(entry.mealType)
                                  : ""}
                              </span>
                              {entry.foodName || entry.mealName ? (
                                <span className="text-gray-400 block text-xs mt-0.5">
                                  {entry.foodName || entry.mealName}
                                </span>
                              ) : null}
                            </div>
                          </td>{" "}
                          <td className="px-4 py-3 text-center text-sm font-medium text-green-400">
                            <AnimatedNumber
                              value={Math.round(entry.protein) || 0}
                              suffix="g"
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-blue-400">
                            <AnimatedNumber
                              value={Math.round(entry.carbs) || 0}
                              suffix="g"
                            />
                          </td>
                          <td className="px-4 py-3 text-center text-sm font-medium text-red-400">
                            <AnimatedNumber
                              value={Math.round(entry.fats) || 0}
                              suffix="g"
                            />
                          </td>{" "}
                          <td className="px-4 py-3 text-center font-medium text-white">
                            <AnimatedNumber
                              value={Math.round(
                                entry.protein * 4 +
                                  entry.carbs * 4 +
                                  entry.fats * 9
                              )}
                              suffix=" kcal"
                            />
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

      {/* Add ConfirmationModal component */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDateToDelete(null);
        }}
        title="Delete Entries"
        variant="confirmation"
        message={`Are you sure you want to delete all entries for ${
          dateToDelete ? formatDate(dateToDelete) : ""
        }? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Cancel"
        onConfirm={confirmDeleteDate}
        isDanger={true}
      />
    </div>
  );
};

// Export memoized component
export default memo(EntryHistoryComponent);

// Helper function for meal type display
function capitalizeFirstLetter(string: string): string {
  if (!string) return "";
  return (
    string.charAt(0).toUpperCase() +
    string
      .slice(1)
      .replace(/🍳|🍗|🍽️|🧃/, "")
      .trim()
  );
}

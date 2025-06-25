import {
  useEffect,
  useState,
  Fragment,
  useMemo,
  memo,
  useCallback,
} from "react";
import {
  ExportIcon,
  ChevronDownIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@/components/Icons";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { MacroCell } from "@/components/nutrition";
import { ActionButtonGroup } from "@/components/form";
import { MacroEntry } from "../types";

interface EntryHistoryProps {
  history: MacroEntry[];
  deleteEntry: (id: number) => void;
  onEdit: (entry: MacroEntry) => void;
  isDeleting: boolean;
  isEditing: boolean;
}

interface GroupedEntry {
  date: string;
  entries: MacroEntry[];
  totals: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
}

// Consolidated helper functions
const formatEntryDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTimeFromEntry = (entry: MacroEntry): string =>
  entry.entry_time ||
  new Date(entry.created_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const calculateCalories = (
  protein: number,
  carbs: number,
  fats: number
): number => Math.round(protein * 4 + carbs * 4 + fats * 9);

const capitalizeFirstLetter = (string: string): string =>
  string
    ? string.charAt(0).toUpperCase() +
      string
        .slice(1)
        .replace(/🍳|🍗|🍽️|🧃/, "")
        .trim()
    : "";

const TableHeader = memo(
  ({ label, color }: { label: string; color?: string }) => (
    <th className="w-1/6 px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-700/50">
      {color ? (
        <div className="flex items-center justify-center gap-1">
          <div className={`w-2 h-2 ${color} rounded-full`}></div>
          {label}
        </div>
      ) : (
        label
      )}
    </th>
  )
);

// Simplified Entry Row Component
const EntryRow = memo(
  ({
    entry,
    onEdit,
    deleteEntry,
    isDeleting,
  }: {
    entry: MacroEntry;
    onEdit: (entry: MacroEntry) => void;
    deleteEntry: (id: number) => void;
    isDeleting: boolean;
  }) => (
    <tr className="border-b border-gray-700/30 hover:bg-gray-700/20 transition-colors">
      <td className="px-4 py-3 text-sm text-gray-300 whitespace-nowrap pl-11">
        {formatTimeFromEntry(entry)}
      </td>
      <td className="px-4 py-3 text-sm text-gray-300 text-center">
        <div>
          <span className="font-medium text-indigo-300">
            {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
          </span>
          {(entry.foodName || entry.mealName) && (
            <span className="text-gray-400 block text-xs mt-0.5">
              {entry.foodName || entry.mealName}
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center text-sm font-medium text-green-400">
        <MacroCell value={entry.protein} suffix="g" color="text-green-400" />
      </td>
      <td className="px-4 py-3 text-center text-sm font-medium text-blue-400">
        <MacroCell value={entry.carbs} suffix="g" color="text-blue-400" />
      </td>
      <td className="px-4 py-3 text-center text-sm font-medium text-red-400">
        <MacroCell value={entry.fats} suffix="g" color="text-red-400" />
      </td>
      <td className="px-4 py-3 text-center font-medium text-white">
        <MacroCell
          value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
          suffix=" kcal"
          color="text-white"
        />
      </td>
      <td className="px-4 py-3 text-center whitespace-nowrap">
        <ActionButtonGroup
          onEdit={() => onEdit(entry)}
          onDelete={() => deleteEntry(entry.id)}
          isDeleting={isDeleting}
        />
      </td>
    </tr>
  )
);

EntryRow.displayName = "EntryRow";

// Simplified Entry Card Component
const EntryCard = memo(
  ({
    entry,
    onEdit,
    deleteEntry,
    isDeleting,
  }: {
    entry: MacroEntry;
    onEdit: (entry: MacroEntry) => void;
    deleteEntry: (id: number) => void;
    isDeleting: boolean;
  }) => (
    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-gray-300 text-sm font-medium">
            {formatTimeFromEntry(entry)}
          </span>
          <span className="text-indigo-300 font-medium text-sm">
            {entry.mealType ? capitalizeFirstLetter(entry.mealType) : ""}
          </span>
        </div>
        <ActionButtonGroup
          onEdit={() => onEdit(entry)}
          onDelete={() => deleteEntry(entry.id)}
          isDeleting={isDeleting}
        />
      </div>

      {(entry.foodName || entry.mealName) && (
        <div className="mb-3">
          <span className="text-gray-400 text-sm">
            {entry.foodName || entry.mealName}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
          <span className="text-gray-400 text-sm">Protein</span>
          <MacroCell value={entry.protein} suffix="g" color="text-green-400" />
        </div>
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
          <span className="text-gray-400 text-sm">Carbs</span>
          <MacroCell value={entry.carbs} suffix="g" color="text-blue-400" />
        </div>
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3">
          <span className="text-gray-400 text-sm">Fats</span>
          <MacroCell value={entry.fats} suffix="g" color="text-red-400" />
        </div>
        <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3 col-span-3">
          <span className="text-gray-400 text-sm">Calories</span>
          <MacroCell
            value={calculateCalories(entry.protein, entry.carbs, entry.fats)}
            suffix=" kcal"
            color="text-white"
          />
        </div>
      </div>
    </div>
  )
);

EntryCard.displayName = "EntryCard";

const exportCSV = (history: MacroEntry[]) => {
  const csvContent = [
    "Date, Time, Meal Type, Meal Name, Protein (g), Carbs (g), Fats (g), Calories",
    ...history.map(
      (entry) =>
        `${
          entry.entry_date || new Date(entry.created_at).toLocaleDateString()
        },${new Date(entry.created_at).toLocaleTimeString()},${
          entry.mealType || ""
        },${entry.foodName || entry.mealName || ""},${entry.protein},${
          entry.carbs
        },${entry.fats},${calculateCalories(
          entry.protein,
          entry.carbs,
          entry.fats
        )}`
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  Object.assign(a, { href: url, download: "macro-entries.csv" });
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const EntryHistoryComponent = function EntryHistory({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
}: EntryHistoryProps) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | null>(null);

  // Memoize today's date
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-UK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Memoize the formatDate function
  const formatDate = useCallback(
    (dateString: string) => {
      return dateString === todayFormatted ? "Today" : dateString;
    },
    [todayFormatted]
  );

  // Memoize grouped entries with totals
  const groupedEntries = useMemo((): GroupedEntry[] => {
    const grouped = history.reduce((acc, entry) => {
      const dateKey = formatEntryDate(entry.entry_date || entry.created_at);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, MacroEntry[]>);

    return Object.entries(grouped)
      .map(([date, entries]) => ({
        date,
        entries,
        totals: entries.reduce(
          (acc, entry) => ({
            protein: acc.protein + (entry.protein || 0),
            carbs: acc.carbs + (entry.carbs || 0),
            fats: acc.fats + (entry.fats || 0),
            calories:
              acc.calories +
              calculateCalories(entry.protein, entry.carbs, entry.fats),
          }),
          { protein: 0, carbs: 0, fats: 0, calories: 0 }
        ),
      }))
      .map((group) => ({
        ...group,
        totals: {
          protein: Math.round(group.totals.protein),
          carbs: Math.round(group.totals.carbs),
          fats: Math.round(group.totals.fats),
          calories: Math.round(group.totals.calories),
        },
      }))
      .sort(
        (a, b) =>
          new Date(
            b.entries[0].entry_date || b.entries[0].created_at
          ).getTime() -
          new Date(a.entries[0].entry_date || a.entries[0].created_at).getTime()
      );
  }, [history]);

  // Initialize collapsed dates
  useEffect(() => {
    setCollapsedDates((prev) => {
      if (prev.size === 0) {
        return new Set(
          groupedEntries
            .filter((group) => group.date !== todayFormatted)
            .map((group) => group.date)
        );
      }
      const existingDates = new Set(groupedEntries.map((group) => group.date));
      return new Set([...prev].filter((date) => existingDates.has(date)));
    });
  }, [groupedEntries, todayFormatted]);

  // Memoized event handlers
  const toggleDateCollapse = useCallback((date: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      newSet.has(date) ? newSet.delete(date) : newSet.add(date);
      return newSet;
    });
  }, []);

  const handleDeleteDate = useCallback((date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDateToDelete(date);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeleteDate = useCallback(() => {
    if (!dateToDelete) return;
    const group = groupedEntries.find((g) => g.date === dateToDelete);
    group?.entries.forEach((entry) => deleteEntry(entry.id));
    setIsDeleteModalOpen(false);
    setDateToDelete(null);
  }, [dateToDelete, groupedEntries, deleteEntry]);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDateToDelete(null);
  }, []);

  const handleExportCSV = useCallback(() => exportCSV(history), [history]);

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
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500/90 text-white text-sm font-medium rounded-lg flex items-center transition-all duration-200 shadow-lg shadow-emerald-600/20"
          >
            <ExportIcon className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="No entries yet"
          message="Get started by logging your first meal using the form above"
          icon={<PlusCircleIcon className="w-10 h-10 text-gray-500" />}
          size="lg"
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm shadow-xl">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr>
                  <TableHeader label="Time" />
                  <TableHeader label="Meal" />
                  <TableHeader label="Protein" color="bg-green-500" />
                  <TableHeader label="Carbs" color="bg-blue-500" />
                  <TableHeader label="Fats" color="bg-red-500" />
                  <TableHeader label="Calories" />
                  <TableHeader label="Actions" />
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
                      <td className="px-4 py-2.5"></td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-green-400">
                        {group.totals.protein}g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-blue-400">
                        {group.totals.carbs}g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-red-400">
                        {group.totals.fats}g
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm font-semibold text-white">
                        {group.totals.calories} kcal
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
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          onEdit={onEdit}
                          deleteEntry={deleteEntry}
                          isDeleting={isDeleting}
                        />
                      ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {groupedEntries.map((group) => (
              <div
                key={group.date}
                className="border-b border-gray-700/30 last:border-b-0"
              >
                {/* Date Header */}
                <div
                  className="flex items-center justify-between p-4 bg-indigo-600/10 border-b border-indigo-500/20 cursor-pointer hover:bg-indigo-600/20 transition-colors"
                  onClick={() => toggleDateCollapse(group.date)}
                >
                  <div className="flex items-center gap-3">
                    {collapsedDates.has(group.date) ? (
                      <ChevronDownIcon className="w-5 h-5 -rotate-90 transform transition-transform text-indigo-300" />
                    ) : (
                      <ChevronDownIcon className="w-5 h-5 transform transition-transform text-indigo-300" />
                    )}
                    <h3 className="font-semibold text-indigo-300 text-base">
                      {formatDate(group.date)}
                    </h3>
                  </div>

                  {/* Date Totals */}
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-green-400 font-medium">
                      {group.totals.protein}g P
                    </span>
                    <span className="text-blue-400 font-medium">
                      {group.totals.carbs}g C
                    </span>
                    <span className="text-red-400 font-medium">
                      {group.totals.fats}g F
                    </span>
                    <span className="text-white font-medium">
                      {group.totals.calories} kcal
                    </span>
                    <button
                      onClick={(e) => handleDeleteDate(group.date, e)}
                      className="p-1.5 rounded-md bg-red-600/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 transition-colors"
                      aria-label={`Delete all entries for ${formatDate(
                        group.date
                      )}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Entries */}
                {!collapsedDates.has(group.date) && (
                  <div className="space-y-3 p-4">
                    {group.entries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        onEdit={onEdit}
                        deleteEntry={deleteEntry}
                        isDeleting={isDeleting}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add ConfirmationModal component */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
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

EntryHistoryComponent.displayName = "EntryHistoryPanel";

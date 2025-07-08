import { useEffect, useState, useMemo, memo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ExportIcon,
  PlusCircleIcon,
  ChevronDownIcon,
} from "@/components/Icons";
import { ProFeature } from "@/components/ProFeature";
import Modal from "@/components/Modal";
import EmptyState from "@/components/EmptyState";
import AnimatedNumber from "@/components/animation/AnimatedNumber";
import DesktopEntryTable from "./DesktopEntryTable";
import MobileEntryCards from "./MobileEntryCards";
import { MacroEntry } from "@/types/macro";
interface EntryHistoryProps {
  history: MacroEntry[];
  deleteEntry: (id: number) => void;
  onEdit: (entry: MacroEntry) => void;
  isDeleting: boolean;
  isEditing: boolean;
}

// Consolidated helper functions
const formatEntryDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const formatTimeFromEntry = (entry: MacroEntry): string =>
  entry.entryTime ||
  new Date(entry.createdAt).toLocaleTimeString([], {
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

const exportCSV = (history: MacroEntry[]) => {
  const csvContent = [
    "Date, Time, Meal Type, Meal Name, Protein (g), Carbs (g), Fats (g), Calories",
    ...history.map(
      (entry) =>
        `${
          entry.entryDate || new Date(entry.createdAt).toLocaleDateString()
        },${new Date(entry.createdAt).toLocaleTimeString()},${
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
  const [showAllDates, setShowAllDates] = useState(false);
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

  // Memoize grouped entries with totals and filter by show more state
  const { displayedEntries, totalEntries, hasMoreDates } = useMemo(() => {
    const grouped = history.reduce((acc, entry) => {
      const dateKey = formatEntryDate(entry.entryDate || entry.createdAt);
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(entry);
      return acc;
    }, {} as Record<string, MacroEntry[]>);

    const allEntries = Object.entries(grouped)
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
          new Date(b.entries[0].entryDate || b.entries[0].createdAt).getTime() -
          new Date(a.entries[0].entryDate || a.entries[0].createdAt).getTime()
      );

    const displayed = showAllDates ? allEntries : allEntries.slice(0, 5);

    return {
      displayedEntries: displayed,
      totalEntries: allEntries,
      hasMoreDates: allEntries.length > 5,
    };
  }, [history, showAllDates]);

  // Initialize collapsed dates
  useEffect(() => {
    setCollapsedDates((prev) => {
      if (prev.size === 0) {
        return new Set(
          totalEntries
            .filter((group) => group.date !== todayFormatted)
            .map((group) => group.date)
        );
      }
      const existingDates = new Set(totalEntries.map((group) => group.date));
      return new Set([...prev].filter((date) => existingDates.has(date)));
    });
  }, [totalEntries, todayFormatted]);

  // Memoized event handlers
  const toggleDateCollapse = useCallback((date: string) => {
    setCollapsedDates((prev) => {
      const newSet = new Set(prev);
      newSet.has(date) ? newSet.delete(date) : newSet.add(date);
      return newSet;
    });
  }, []);

  const toggleShowAllDates = useCallback(() => {
    setShowAllDates((prev) => !prev);
  }, []);

  const handleDeleteDate = useCallback((date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDateToDelete(date);
    setIsDeleteModalOpen(true);
  }, []);

  const confirmDeleteDate = useCallback(() => {
    if (!dateToDelete) return;
    const group = totalEntries.find((g) => g.date === dateToDelete);
    group?.entries.forEach((entry) => deleteEntry(entry.id));
    setIsDeleteModalOpen(false);
    setDateToDelete(null);
  }, [dateToDelete, totalEntries, deleteEntry]);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDateToDelete(null);
  }, []);

  const handleExportCSV = useCallback(() => exportCSV(history), [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-gray-100">Entry History</h2>{" "}
          <p className="text-sm text-gray-400 mt-1">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={totalEntries.length} />{" "}
            {totalEntries.length === 1 ? "day" : "days"}
          </p>
        </motion.div>
        {history.length > 0 && (
          <ProFeature>
            <motion.button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-emerald-600/90 hover:bg-emerald-500/90 text-white text-sm font-medium rounded-lg flex items-center transition-all duration-200 shadow-lg shadow-emerald-600/20"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ExportIcon className="w-4 h-4 mr-2" />
              Export CSV
            </motion.button>
          </ProFeature>
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
        <motion.div
          className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm shadow-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
        >
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <DesktopEntryTable
              groupedEntries={displayedEntries}
              collapsedDates={collapsedDates}
              formatDate={formatDate}
              formatTimeFromEntry={formatTimeFromEntry}
              capitalizeFirstLetter={capitalizeFirstLetter}
              calculateCalories={calculateCalories}
              toggleDateCollapse={toggleDateCollapse}
              handleDeleteDate={handleDeleteDate}
              onEdit={onEdit}
              deleteEntry={deleteEntry}
              isDeleting={isDeleting}
              showAllDates={showAllDates}
            />
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <MobileEntryCards
              groupedEntries={displayedEntries}
              collapsedDates={collapsedDates}
              formatDate={formatDate}
              formatTimeFromEntry={formatTimeFromEntry}
              capitalizeFirstLetter={capitalizeFirstLetter}
              calculateCalories={calculateCalories}
              toggleDateCollapse={toggleDateCollapse}
              handleDeleteDate={handleDeleteDate}
              onEdit={onEdit}
              deleteEntry={deleteEntry}
              isDeleting={isDeleting}
              showAllDates={showAllDates}
            />
          </div>

          {/* Show More Dates Button */}
          {hasMoreDates && (
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button
                onClick={toggleShowAllDates}
                className="px-4 py-2 text-sm text-gray-400 hover:text-gray-300 bg-transparent hover:bg-gray-700/30 rounded-md transition-all duration-200 flex items-center gap-2 border border-gray-600/30 hover:border-gray-500/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                animate={{
                  borderColor: showAllDates
                    ? "rgba(156, 163, 175, 0.5)"
                    : "rgba(156, 163, 175, 0.3)",
                  backgroundColor: showAllDates
                    ? "rgba(107, 114, 128, 0.2)"
                    : "rgba(107, 114, 128, 0)",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={showAllDates ? "less" : "more"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {showAllDates ? "Show Less Dates" : "Show More Dates"}
                  </motion.span>
                </AnimatePresence>
                <motion.div
                  animate={{
                    rotate: showAllDates ? 180 : 0,
                    scale: showAllDates ? 1.1 : 1,
                  }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </motion.div>
              </motion.button>
            </motion.div>
          )}
        </motion.div>
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
    </motion.div>
  );
};

// Export memoized component
export default memo(EntryHistoryComponent);

EntryHistoryComponent.displayName = "EntryHistoryPanel";

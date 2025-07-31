import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useMemo, useState } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ProFeature } from "@/components/billing/ProFeature";
import {
  Button,
  ChevronDownIcon,
  ExportIcon,
  LoadingSpinner,
  PlusCircleIcon,
} from "@/components/ui";
import EmptyState from "@/components/ui/EmptyState";
import IconButton from "@/components/ui/IconButton";
import Modal from "@/components/ui/Modal";
import { MacroEntry } from "@/types/macro";

import DesktopEntryTable from "./DesktopEntryTable";
import MobileEntryCards from "./MobileEntryCards";

interface EntryHistoryProps {
  history: MacroEntry[];
  deleteEntry: (id: number) => void;
  onEdit: (entry: MacroEntry) => void;
  isDeleting: boolean;
  isEditing: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

// Consolidated helper functions
const formatEntryDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-UK", {
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
  fats: number,
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
    "Date, Time, Meal Type, Meal Name, Protein (g), Carbs (g), Fats (g), Calories (kcal)",
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
          entry.fats,
        )}`,
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = globalThis.URL.createObjectURL(blob);
  const a = document.createElement("a");
  Object.assign(a, { href: url, download: "macro-entries.csv" });
  document.body.append(a);
  a.click();
  a.remove();
  globalThis.URL.revokeObjectURL(url);
};

const EntryHistoryComponent = function EntryHistory({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
  hasMore,
  onLoadMore,
  isLoadingMore,
}: EntryHistoryProps) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [displayedDateCount, setDisplayedDateCount] = useState(5);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | undefined>();

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
    [todayFormatted],
  );

  // Memoize grouped entries with totals and incremental pagination
  const { displayedEntries, totalEntries, hasMoreDates } = useMemo(() => {
    const grouped: Record<string, MacroEntry[]> = {};
    for (const entry of history) {
      const dateKey = formatEntryDate(entry.entryDate || entry.createdAt);
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(entry);
    }

    const allEntries = Object.entries(grouped)
      .map(([date, entries]) => {
        // Replace reduce with a loop for totals
        const totals = { protein: 0, carbs: 0, fats: 0, calories: 0 };
        for (const entry of entries) {
          totals.protein += entry.protein || 0;
          totals.carbs += entry.carbs || 0;
          totals.fats += entry.fats || 0;
          totals.calories += calculateCalories(
            entry.protein,
            entry.carbs,
            entry.fats,
          );
        }
        return {
          date,
          entries,
          totals,
        };
      })
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
          new Date(a.entries[0].entryDate || a.entries[0].createdAt).getTime(),
      );

    // Show entries up to displayedDateCount
    const displayed = allEntries.slice(0, displayedDateCount);

    return {
      displayedEntries: displayed,
      totalEntries: allEntries,
      hasMoreDates: allEntries.length > displayedDateCount,
    };
  }, [history, displayedDateCount]);

  // Reset displayed count when history changes significantly (new data loaded)
  const [previousTotalDates, setPreviousTotalDates] = useState(0);

  useEffect(() => {
    const currentTotalDates = totalEntries.length;
    // If we have significantly more dates than before, it means new data was loaded
    if (currentTotalDates > previousTotalDates + 3) {
      // Keep the current displayedDateCount to show all the data that was loaded
      // This ensures that when server loads more data, user sees it immediately
    }
    setPreviousTotalDates(currentTotalDates);
  }, [totalEntries.length, previousTotalDates]);

  // Initialize collapsed dates
  // Always add any new dates (except today) to the collapsed set
  useEffect(() => {
    setCollapsedDates((previous) => {
      const allDates = totalEntries.map((group) => group.date);

      // Check if we need to add any new dates
      const newDatesToAdd = allDates.filter(
        (date) => date !== todayFormatted && !previous.has(date),
      );

      // Check if we need to remove any dates that no longer exist
      const datesToRemove = [...previous].filter(
        (date) => !allDates.includes(date),
      );

      // Only create new Set if there are actual changes
      if (newDatesToAdd.length > 0 || datesToRemove.length > 0) {
        const newSet = new Set(previous);
        for (const date of newDatesToAdd) newSet.add(date);
        for (const date of datesToRemove) newSet.delete(date);
        return newSet;
      }

      // Return the same reference if no changes
      return previous;
    });
  }, [totalEntries, todayFormatted]);

  // Memoized event handlers
  const toggleDateCollapse = useCallback((date: string) => {
    setCollapsedDates((previous) => {
      const newSet = new Set(previous);
      newSet.has(date) ? newSet.delete(date) : newSet.add(date);
      return newSet;
    });
  }, []);

  const loadMoreDates = useCallback(async () => {
    // First, try to fetch more data from server if needed
    // We want to ensure we have enough data to show 5 more dates
    const currentlyShowing = displayedDateCount;
    const targetDateCount = currentlyShowing + 5;
    const availableDates = totalEntries.length;

    // If we don't have enough dates locally to reach our target, fetch more from server first
    if (availableDates < targetDateCount && hasMore && onLoadMore) {
      await onLoadMore();
    }

    // Then increment the displayed count
    setDisplayedDateCount(targetDateCount);
  }, [displayedDateCount, hasMore, onLoadMore, totalEntries.length]);

  const showLessDates = useCallback(() => {
    // Reset to initial 5 dates
    setDisplayedDateCount(5);
  }, []);

  const handleDeleteDate = useCallback(
    (date: string, event: React.MouseEvent) => {
      event.stopPropagation();
      setDateToDelete(date);
      setIsDeleteModalOpen(true);
    },
    [],
  );

  const confirmDeleteDate = useCallback(() => {
    if (!dateToDelete) return;
    const group = totalEntries.find((g) => g.date === dateToDelete);
    if (group && group.entries) {
      for (const entry of group.entries) deleteEntry(entry.id);
    }
    setIsDeleteModalOpen(false);
    setDateToDelete(undefined);
  }, [dateToDelete, totalEntries, deleteEntry]);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDateToDelete(undefined);
  }, []);

  const handleExportCSV = useCallback(() => exportCSV(history), [history]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Heading row for mobile: flex with export button inline */}
      <div className="flex items-center justify-between mb-6 gap-4 lg:hidden">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Entry History
          </h2>
          <p className="text-sm text-foreground mt-1">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={totalEntries.length} />{" "}
            {totalEntries.length === 1 ? "day" : "days"}
          </p>
        </div>
        {history.length > 0 && (
          <ProFeature>
            <IconButton
              variant="export"
              ariaLabel="Export data as CSV file"
              onClick={handleExportCSV}
              className="mr-1"
            />
          </ProFeature>
        )}
      </div>

      {/* Heading row for desktop: flex with export button right-aligned */}
      <div className="hidden lg:flex flex-row justify-between items-center mb-6 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-foreground">
            Entry History
          </h2>{" "}
          <p className="text-sm text-foreground mt-1">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={totalEntries.length} />{" "}
            {totalEntries.length === 1 ? "day" : "days"}
          </p>
        </motion.div>
        {history.length > 0 && (
          <ProFeature>
            <Button
              icon={<ExportIcon />}
              iconPosition="left"
              onClick={handleExportCSV}
              text="Export CSV"
              buttonSize="lg"
            />
          </ProFeature>
        )}
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="No entries yet"
          message="Get started by logging your first meal using the form above"
          icon={<PlusCircleIcon className="w-10 h-10 text-foreground" />}
          size="lg"
        />
      ) : (
        <motion.div
          className="overflow-hidden rounded-2xl border border-border bg-background/50 backdrop-blur-sm shadow-modal"
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
            />
          </div>

          {/* Load More / Show Less Button */}
          {(hasMoreDates || hasMore || displayedDateCount > 5) && (
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Show "Load More" button when there's more data to show */}
              {(hasMoreDates || hasMore) && (
                <motion.button
                  onClick={loadMoreDates}
                  className={`px-4 py-2 text-sm text-foreground hover:text-foreground bg-transparent hover:bg-surface/30 rounded-md transition-all duration-200 flex items-center gap-2 border border-border/30 hover:border-border/50 ${
                    isLoadingMore ? "opacity-60 cursor-not-allowed" : ""
                  }`}
                  disabled={isLoadingMore}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {isLoadingMore && <LoadingSpinner />}
                  <AnimatePresence mode="wait">
                    <motion.span
                      key="load-more"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Load More Dates
                    </motion.span>
                  </AnimatePresence>
                  <ChevronDownIcon className="w-4 h-4 text-foreground" />
                </motion.button>
              )}

              {/* Show "Show Less" button when no more data and showing more than 5 dates */}
              {!hasMoreDates && !hasMore && displayedDateCount > 5 && (
                <motion.button
                  onClick={showLessDates}
                  className="px-4 py-2 text-sm text-foreground hover:text-foreground bg-transparent hover:bg-surface/30 rounded-md transition-all duration-200 flex items-center gap-2 border border-border/30 hover:border-border/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <AnimatePresence mode="wait">
                    <motion.span
                      key="show-less"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      Show Less
                    </motion.span>
                  </AnimatePresence>
                  <ChevronDownIcon className="w-4 h-4 rotate-180" />
                </motion.button>
              )}
            </motion.div>
          )}
          {/* Remove old Load More Pagination Button */}
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

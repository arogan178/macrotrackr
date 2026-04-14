import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { ProFeature } from "@/components/billing/ProFeature";
import {
  Button,
  ChevronDownIcon,
  EmptyState,
  ExportIcon,
  IconButton,
  LoadingSpinner,
  LockIcon,
  Modal,
  PlusCircleIcon,
} from "@/components/ui";
import { HistoryLimits, MacroEntry } from "@/types/macro";

import DesktopEntryTable from "./DesktopEntryTable";
import {
  calculateCalories,
  capitalizeFirstLetter,
  formatEntryDate,
  formatTimeFromEntry,
} from "./EntryHistoryHelpers";
import { EntryHistoryContext } from "./EntryHistoryContext";
import type { EntryHistoryController } from "./EntryHistoryShared";
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
  limits?: HistoryLimits;
  onSaveMeal?: (entry: MacroEntry) => void;
  onUnsaveMeal?: (entry: MacroEntry) => void;
  savedMealIds?: Set<number>;
  onGroupMeals?: (
    name: string,
    mealType: string,
    selectedEntries: MacroEntry[],
  ) => Promise<void>;
  onExportCsv?: () => Promise<void> | void;
  isExportingCsv?: boolean;
}

const EntryHistoryComponent = function EntryHistory({
  history,
  deleteEntry,
  onEdit,
  isDeleting,
  hasMore,
  onLoadMore,
  isLoadingMore,
  limits,
  onSaveMeal,
  onUnsaveMeal,
  savedMealIds,
  onGroupMeals,
  onExportCsv,
  isExportingCsv = false,
}: EntryHistoryProps) {
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [displayedDateCount, setDisplayedDateCount] = useState(5);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dateToDelete, setDateToDelete] = useState<string | undefined>();

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<number>>(
    new Set(),
  );
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupMealName, setGroupMealName] = useState("");
  const [groupMealType, setGroupMealType] = useState("snack");

  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((previous) => !previous);
    if (isSelectionMode) {
      setSelectedEntryIds(new Set()); // Clear selections when exiting mode
    }
  }, [isSelectionMode]);

  const toggleEntrySelection = useCallback((id: number) => {
    setSelectedEntryIds((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }

      return newSet;
    });
  }, []);

  const handleCreateGroupMeal = useCallback(() => {
    if (selectedEntryIds.size < 2) return;
    setIsGroupModalOpen(true);
  }, [selectedEntryIds]);

  const confirmGroupMeals = useCallback(async () => {
    if (!onGroupMeals || !groupMealName || selectedEntryIds.size < 2) return;

    const selectedEntries = history.filter((entry) =>
      selectedEntryIds.has(entry.id),
    );
    await onGroupMeals(groupMealName, groupMealType, selectedEntries);

    setIsGroupModalOpen(false);
    setIsSelectionMode(false);
    setSelectedEntryIds(new Set());
    setGroupMealName("");
  }, [onGroupMeals, groupMealName, groupMealType, selectedEntryIds, history]);

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-UK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const formatDate = useCallback(
    (dateString: string) => {
      return dateString === todayFormatted ? "Today" : dateString;
    },
    [todayFormatted],
  );

  const { displayedEntries, totalEntries, hasMoreDates } = useMemo(() => {
    const grouped: Record<string, MacroEntry[]> = Object.create(null);
    for (const entry of history) {
      const dateKey = formatEntryDate(entry.entryDate);
      (grouped[dateKey] ??= []).push(entry);
    }

    const allEntries = Object.entries(grouped)
      .map(([date, entries]) => {
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
          new Date(b.entries[0].entryDate).getTime() -
          new Date(a.entries[0].entryDate).getTime(),
      );

    const displayed = allEntries.slice(0, displayedDateCount);

    return {
      displayedEntries: displayed,
      totalEntries: allEntries,
      hasMoreDates: allEntries.length > displayedDateCount,
    };
  }, [history, displayedDateCount]);

  useEffect(() => {
    setCollapsedDates((previous) => {
      const allDates = totalEntries.map((group) => group.date);

      const newDatesToAdd = allDates.filter(
        (date) => date !== todayFormatted && !previous.has(date),
      );

      const datesToRemove = [...previous].filter(
        (date) => !allDates.includes(date),
      );

      if (newDatesToAdd.length > 0 || datesToRemove.length > 0) {
        const newSet = new Set(previous);
        for (const date of newDatesToAdd) newSet.add(date);
        for (const date of datesToRemove) newSet.delete(date);

        return newSet;
      }

      return previous;
    });
  }, [totalEntries, todayFormatted]);

  const toggleDateCollapse = useCallback((date: string) => {
    setCollapsedDates((previous) => {
      const newSet = new Set(previous);
      newSet.has(date) ? newSet.delete(date) : newSet.add(date);

      return newSet;
    });
  }, []);

  const loadMoreDates = useCallback(async () => {
    const currentlyShowing = displayedDateCount;
    const targetDateCount = currentlyShowing + 5;
    const availableDates = totalEntries.length;

    if (availableDates < targetDateCount && hasMore && onLoadMore) {
      await onLoadMore();
    }

    setDisplayedDateCount(targetDateCount);
  }, [displayedDateCount, hasMore, onLoadMore, totalEntries.length]);

  const showLessDates = useCallback(() => {
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

  const isDateCollapsed = useCallback(
    (date: string) => collapsedDates.has(date),
    [collapsedDates],
  );

  const isMealSaved = useCallback(
    (entryId: number) => savedMealIds?.has(entryId) ?? false,
    [savedMealIds],
  );

  const isEntrySelected = useCallback(
    (entryId: number) => selectedEntryIds.has(entryId),
    [selectedEntryIds],
  );

  const controller = useMemo<EntryHistoryController>(
    () => ({
      formatDate,
      formatTimeFromEntry,
      capitalizeFirstLetter,
      calculateCalories,
      isDateCollapsed,
      toggleDateCollapse,
      handleDeleteDate,
      onEdit,
      deleteEntry,
      onSaveMeal,
      onUnsaveMeal,
      isMealSaved,
      isDeleting,
      isSelectionMode,
      isEntrySelected,
      onToggleEntrySelection: toggleEntrySelection,
    }),
    [
      formatDate,
      isDateCollapsed,
      toggleDateCollapse,
      handleDeleteDate,
      onEdit,
      deleteEntry,
      onSaveMeal,
      onUnsaveMeal,
      isMealSaved,
      isDeleting,
      isSelectionMode,
      isEntrySelected,
      toggleEntrySelection,
    ],
  );

  const confirmDeleteDate = useCallback(() => {
    if (!dateToDelete) return;
    const group = totalEntries.find((g) => g.date === dateToDelete);
    if (group?.entries) {
      for (const entry of group.entries) deleteEntry(entry.id);
    }
    setIsDeleteModalOpen(false);
    setDateToDelete(undefined);
  }, [dateToDelete, totalEntries, deleteEntry]);

  const closeDeleteModal = useCallback(() => {
    setIsDeleteModalOpen(false);
    setDateToDelete(undefined);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="mb-5 flex items-center justify-between gap-4 lg:hidden">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Entry History
          </h2>
          <p className="mt-1 text-sm text-muted">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={totalEntries.length} />{" "}
            {totalEntries.length === 1 ? "day" : "days"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <Button
              variant={isSelectionMode ? "primary" : "secondary"}
              onClick={toggleSelectionMode}
              text={isSelectionMode ? "Cancel" : "Select"}
              buttonSize="sm"
            />
          )}
          {history.length > 0 && (
            <ProFeature>
              <IconButton
                variant="export"
                ariaLabel="Export data as CSV file"
                onClick={onExportCsv}
                disabled={isExportingCsv}
                className="mr-1"
              />
            </ProFeature>
          )}
        </div>
      </div>

      <div className="mb-6 hidden flex-row items-center justify-between gap-4 lg:flex">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Entry History
          </h2>{" "}
          <p className="mt-1 text-sm text-muted">
            <AnimatedNumber value={history.length} />{" "}
            {history.length === 1 ? "entry" : "entries"} across{" "}
            <AnimatedNumber value={totalEntries.length} />{" "}
            {totalEntries.length === 1 ? "day" : "days"}
          </p>
        </motion.div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <Button
              variant={isSelectionMode ? "primary" : "secondary"}
              onClick={toggleSelectionMode}
              text={isSelectionMode ? "Cancel Selection" : "Group Meals"}
              buttonSize="sm"
            />
          )}
          {history.length > 0 && (
            <ProFeature>
              <Button
                leftIcon={<ExportIcon />}
                onClick={onExportCsv}
                text={isExportingCsv ? "Exporting..." : "Export CSV"}
                buttonSize="sm"
                isLoading={isExportingCsv}
              />
            </ProFeature>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="No entries yet"
          message="Get started by logging your first meal using the form above"
          icon={<PlusCircleIcon className="h-10 w-10 text-foreground" />}
          size="lg"
        />
      ) : (
        <motion.div
          className="overflow-hidden rounded-xl border border-border bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <EntryHistoryContext.Provider value={controller}>
            <div className="hidden lg:block">
              <DesktopEntryTable groupedEntries={displayedEntries} />
            </div>

            <div className="lg:hidden">
              <MobileEntryCards groupedEntries={displayedEntries} />
            </div>
          </EntryHistoryContext.Provider>

          {(hasMoreDates || hasMore || displayedDateCount > 5) && (
            <motion.div
              className="flex justify-center py-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {(hasMoreDates || hasMore) && (
                <motion.button
                  onClick={loadMoreDates}
                  className={`flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground ${
                    isLoadingMore ? "cursor-not-allowed opacity-60" : ""
                  }`}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore && <LoadingSpinner />}
                  <span>Load More Dates</span>
                  <ChevronDownIcon className="h-4 w-4 text-foreground" />
                </motion.button>
              )}

              {!hasMoreDates && !hasMore && displayedDateCount > 5 && (
                <motion.button
                  onClick={showLessDates}
                  className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
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
                  <ChevronDownIcon className="h-4 w-4 rotate-180" />
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Free tier upgrade prompt for older entries */}
          {limits?.isRestricted && limits.upgradePrompt && (
            <motion.div
              className="border-t border-border bg-surface-2/50 py-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <ProFeature>
                <div className="flex items-center justify-center gap-2 px-4 text-sm text-muted">
                  <LockIcon className="h-4 w-4 text-primary" />
                  <span>{limits.upgradePrompt}</span>
                </div>
              </ProFeature>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Floating Action Bar for Meal Grouping - Portalled to body */}
      {isSelectionMode &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed bottom-6 left-1/2 z-100 flex -translate-x-1/2 items-center gap-3 rounded-full border border-border/50 bg-surface/90 px-4 py-3 shadow-2xl backdrop-blur-xl md:gap-4 md:px-6 md:py-3.5"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
                <span className="text-sm font-medium whitespace-nowrap text-foreground">
                  {selectedEntryIds.size} selected
                </span>
                <span className="hidden h-4 w-px bg-border md:block" />
                <span className="text-xs whitespace-nowrap text-muted">
                  Select 2+ entries to group
                </span>
              </div>

              <div className="ml-2 flex items-center gap-2">
                <Button
                  variant="primary"
                  onClick={handleCreateGroupMeal}
                  text="Save Group"
                  disabled={selectedEntryIds.size < 2}
                  buttonSize="sm"
                  className="whitespace-nowrap"
                />
                <button
                  onClick={toggleSelectionMode}
                  className="rounded-full p-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none"
                  aria-label="Cancel selection"
                >
                  <svg
                    className="h-4 w-4 md:h-5 md:w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}

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
        isDanger
      />

      <Modal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        title="Save Grouped Meal"
        variant="form"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Group {selectedEntryIds.size} selected entries into a single saved
            meal for easy logging later.
          </p>
          <div>
            <label
              htmlFor="groupMealName"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Meal Name
            </label>
            <input
              id="groupMealName"
              type="text"
              value={groupMealName}
              onChange={(event) => setGroupMealName(event.target.value)}
              placeholder="e.g., Chicken Salad Bowl"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/50 focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
            />
          </div>
          <div>
            <label
              htmlFor="groupMealType"
              className="mb-2 block text-sm font-medium text-foreground"
            >
              Meal Type
            </label>
            <select
              id="groupMealType"
              value={groupMealType}
              onChange={(event) => setGroupMealType(event.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20 focus:outline-hidden"
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              text="Cancel"
              onClick={() => setIsGroupModalOpen(false)}
            />
            <Button
              variant="primary"
              text="Save Meal"
              onClick={confirmGroupMeals}
              disabled={!groupMealName.trim()}
            />
          </div>
        </div>
      </Modal>
    </motion.div>
  );
};

export default memo(EntryHistoryComponent);

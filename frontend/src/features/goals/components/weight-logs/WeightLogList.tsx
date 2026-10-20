import { useCallback, useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns"; // Import isValid and parseISO

import type { WeightLogEntry } from "@/api/goals";
import {
  IconButton,
  LoadingSpinner,
  Modal,
  ProgressiveBlur,
  StateCard,
  TrashIcon,
} from "@/components/ui";
import {
  useDeleteWeightLogEntry,
  useWeightLog,
} from "@/hooks/queries/useGoals";
import { useStore } from "@/store/store";
import { formatWeight, type UnitSystem } from "@/utils/unitConversion";

import LogWeightModal from "./LogWeightModal";

// Most weigh-ins carry no real time, so midnight is left off rather than
// printed as "12:00 AM"; the year appears once it stops being this one.
function formatLogDate(date: Date): string {
  const day = format(
    date,
    date.getFullYear() === new Date().getFullYear() ? "EEE d MMM" : "EEE d MMM yyyy",
  );

  return date.getHours() === 0 && date.getMinutes() === 0
    ? day
    : `${day}, ${format(date, "HH:mm")}`;
}

interface WeightLogListProps {
  isBulkConfirmModalOpen?: boolean;
  onBulkCancel?: () => void;
  unitSystem?: UnitSystem;
}

function WeightLogList({
  isBulkConfirmModalOpen = false,
  onBulkCancel = () => {},
  unitSystem = "metric",
}: WeightLogListProps) {
  // Use TanStack Query hooks instead of Zustand store
  const { data: weightLog = [], isLoading } = useWeightLog();
  const deleteWeightLogMutation = useDeleteWeightLogEntry();
  const isSaving = deleteWeightLogMutation.isPending;

  // Get notification function from store for user feedback
  const showNotification = useStore((state) => state.showNotification);
  const setLogWeightModalOpen = useStore(
    (state) => state.setLogWeightModalOpen,
  );

  // State for confirmation modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // Update state type to use timestamp
  const [itemToDelete, setItemToDelete] = useState<
    | {
        id: string;
        timestamp: string; // Changed from date
        weight: number;
      }
    | undefined
  >();

  const [entryToEdit, setEntryToEdit] = useState<WeightLogEntry | undefined>();

  // State for scroll position detection
  const [isAtBottom, setIsAtBottom] = useState(false);

  // Handle scroll to detect when at bottom
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    // Consider "at bottom" when within 10px of the bottom
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAtBottom(atBottom);
  }, []);

  // Opens the confirmation modal - use timestamp
  const handleDeleteClick = (id: string, timestamp: string, weight: number) => {
    setItemToDelete({ id, timestamp, weight });
    setIsConfirmModalOpen(true);
  };

  // Opens the bulk delete confirmation modal (no longer used)

  // Handles the actual deletion after confirmation
  const handleConfirmDelete = async (event?: React.MouseEvent) => {
    if (event) event.preventDefault(); // Prevent accidental form submit/page reload
    if (!itemToDelete) return;

    try {
      await deleteWeightLogMutation.mutateAsync(itemToDelete.id);
      showNotification("Weight entry deleted successfully", "success");
    } catch {
      showNotification("Failed to delete weight entry", "error");
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(undefined);
    }
  };

  // Handles bulk deletion after confirmation
  const handleConfirmBulkDelete = async (event?: React.MouseEvent) => {
    if (event) event.preventDefault();
    try {
      // Fallback: delete entries one by one
      for (const entry of weightLog) {
        await deleteWeightLogMutation.mutateAsync(entry.id);
      }
      showNotification("All weight entries deleted successfully", "success");
    } catch {
      showNotification("Failed to delete weight entries", "error");
    } finally {
      onBulkCancel();
    }
  };

  // Closes the confirmation modal without deleting
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setItemToDelete(undefined);
  };

  // Sort log by timestamp descending for display
  const sortedLog = useMemo(() => {
    return [...weightLog]
      .filter((entry) => entry.timestamp && isValid(parseISO(entry.timestamp))) // Filter out invalid timestamps first
      .sort(
        (a, b) =>
          parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime(),
      );
  }, [weightLog]);

  // Loading state
  if (isLoading && sortedLog.length === 0) {
    return (
      <div className="flex h-60 flex-col items-center justify-center">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-sm text-muted">Loading weight log...</p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && sortedLog.length === 0) {
    return (
      <div className="h-60">
        <StateCard
          title="No weight logged yet"
          message="Your recorded weights will appear here."
          icon={<TrashIcon className="h-12 w-12 text-foreground" />} // Placeholder icon
          action={{
            label: "Log weight",
            onClick: () => setLogWeightModalOpen(true),
          }}
          size="sm"
          className="h-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="relative h-80">
        <div
          className="absolute inset-0 overflow-y-auto pr-2"
          onScroll={handleScroll}
        >
          <ul className="divide-y divide-border pb-8">
            {sortedLog.map((entry) => {
              // Double-check validity here just in case, though filter should handle it
              const entryDate = parseISO(entry.timestamp);
              const isValidDate = isValid(entryDate);

              return (
                <li
                  key={entry.id}
                  className="group/item flex min-h-16 items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <span className="text-base font-semibold tracking-tight text-foreground tabular-nums">
                      {formatWeight(entry.weight, unitSystem)}
                    </span>
                    <span className="truncate text-xs text-muted">
                      {isValidDate ? formatLogDate(entryDate) : "Unknown date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconButton
                      variant="edit"
                      ariaLabel={
                        isValidDate
                          ? `Edit entry from ${format(entryDate, "PPPp")}`
                          : "Cannot edit entry with invalid date"
                      }
                      onClick={() => setEntryToEdit(entry)}
                      disabled={isSaving || !isValidDate}
                      className="opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 group-focus-within/item:opacity-100 [@media(hover:none)]:opacity-100"
                    />
                    <IconButton
                      variant="delete"
                      ariaLabel={
                        isValidDate
                          ? `Delete entry from ${format(entryDate, "PPPp")}`
                          : "Cannot delete entry with invalid date"
                      }
                      onClick={() => {
                        if (isValidDate)
                          handleDeleteClick(
                            entry.id,
                            entry.timestamp,
                            entry.weight,
                          );
                      }}
                      disabled={isSaving || !isValidDate}
                      icon={
                        isSaving && itemToDelete?.id === entry.id ? (
                          <LoadingSpinner size="sm" />
                        ) : undefined
                      }
                      className={`opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 group-focus-within/item:opacity-100 [@media(hover:none)]:opacity-100 ${
                        (isSaving && itemToDelete?.id === entry.id) ||
                        !isValidDate
                          ? "cursor-not-allowed opacity-50"
                          : ""
                      }`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Progressive blur fixed at bottom of container - hidden when scrolled to bottom */}
        <ProgressiveBlur
          direction="up"
          intensity={0.2}
          height="40px"
          show={!isAtBottom}
        />
      </div>

      {/* Single Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={handleCancelDelete}
          title="Confirm deletion"
          variant="confirmation"
          message={`Are you sure you want to delete the weight entry (${formatWeight(
            itemToDelete.weight,
            unitSystem,
          )}) from ${
            // Safely format the date in the modal message
            isValid(parseISO(itemToDelete.timestamp))
              ? format(parseISO(itemToDelete.timestamp), "PPPp")
              : "an invalid date"
          }?`}
          confirmLabel="Delete entry"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          isDanger
        />
      )}

      <LogWeightModal
        isOpen={entryToEdit !== undefined}
        onClose={() => setEntryToEdit(undefined)}
        entry={entryToEdit}
        unitSystem={unitSystem}
      />

      {/* Bulk Delete Confirmation Modal */}
      {isBulkConfirmModalOpen && (
        <Modal
          isOpen={isBulkConfirmModalOpen}
          onClose={onBulkCancel}
          title="Delete all entries"
          variant="confirmation"
          message={
            "Are you sure you want to delete ALL weight log entries? This action cannot be undone."
          }
          confirmLabel="Delete all"
          cancelLabel="Cancel"
          onConfirm={handleConfirmBulkDelete}
          isDanger
        />
      )}
    </>
  );
}

export default WeightLogList;

import { format, isValid, parseISO } from "date-fns"; // Import isValid and parseISO
import { useMemo, useState } from "react";

import { ActionButton } from "@/components/form";
import { EmptyState, LoadingSpinner, Modal, TrashIcon } from "@/components/ui";
import { useDeleteWeightLogEntry, useWeightLog } from "@/hooks/queries/useGoals";
import { useStore } from "@/store/store";

interface WeightLogListProps {
  isBulkConfirmModalOpen?: boolean;
  onBulkCancel?: () => void;
}

function WeightLogList({
  isBulkConfirmModalOpen = false,
  onBulkCancel = () => {},
}: WeightLogListProps) {
  // Use TanStack Query hooks instead of Zustand store
  const { data: weightLog = [], isLoading } = useWeightLog();
  const deleteWeightLogMutation = useDeleteWeightLogEntry();
  const isSaving = deleteWeightLogMutation.isPending;
  
  // Get notification function from store for user feedback
  const showNotification = useStore((state) => state.showNotification);

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
    } catch (error) {
      console.error("Deletion failed from component:", error);
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
    } catch (error) {
      console.error("Bulk deletion failed:", error);
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
      <div className="h-60 flex flex-col items-center justify-center">
        <LoadingSpinner size="md" />
        <p className="text-gray-400 mt-3 text-sm">Loading weight log...</p>
      </div>
    );
  }

  // Empty state
  if (!isLoading && sortedLog.length === 0) {
    return (
      <div className="h-60">
        <EmptyState
          title="No Weight Logged Yet"
          message="Your recorded weights will appear here."
          icon={
            <TrashIcon className="h-12 w-12 text-gray-500" strokeWidth={1} />
          } // Placeholder icon
          className="h-full"
        />
      </div>
    );
  }

  return (
    <>
      <div className="max-h-80 overflow-y-auto pr-2">
        <ul className="divide-y divide-gray-700/50">
          {sortedLog.map((entry) => {
            // Double-check validity here just in case, though filter should handle it
            const entryDate = parseISO(entry.timestamp);
            const isValidDate = isValid(entryDate);

            return (
              <li
                key={entry.id}
                className="py-2 flex items-center justify-between"
              >
                <div className="flex flex-col min-w-[200px] max-w-[220px]">
                  <span className="text-gray-300 text-sm w-full block truncate">
                    {/* Format timestamp only if valid */}
                    {isValidDate
                      ? format(entryDate, "MMM d, yyyy 'at' p")
                      : "Invalid Date"}
                  </span>
                  <span className="font-semibold text-indigo-300 text-lg mt-1">
                    {entry.weight.toFixed(1)} kg
                  </span>
                </div>
                <ActionButton
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
                  className={
                    (isSaving && itemToDelete?.id === entry.id) || !isValidDate
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }
                />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Single Delete Confirmation Modal */}
      {itemToDelete && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={handleCancelDelete}
          title="Confirm Deletion"
          variant="confirmation"
          message={`Are you sure you want to delete the weight entry (${itemToDelete.weight.toFixed(
            1,
          )} kg) from ${
            // Safely format the date in the modal message
            isValid(parseISO(itemToDelete.timestamp))
              ? format(parseISO(itemToDelete.timestamp), "PPPp")
              : "an invalid date"
          }?`}
          confirmLabel="Delete Entry"
          cancelLabel="Cancel"
          onConfirm={handleConfirmDelete}
          isDanger={true}
        />
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkConfirmModalOpen && (
        <Modal
          isOpen={isBulkConfirmModalOpen}
          onClose={onBulkCancel}
          title="Delete All Entries"
          variant="confirmation"
          message={
            "Are you sure you want to delete ALL weight log entries? This action cannot be undone."
          }
          confirmLabel="Delete All"
          cancelLabel="Cancel"
          onConfirm={handleConfirmBulkDelete}
          isDanger={true}
        />
      )}
    </>
  );
}

export default WeightLogList;

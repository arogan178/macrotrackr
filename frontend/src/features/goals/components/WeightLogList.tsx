import { useState, useMemo } from "react";
import { useStore } from "@/store/store";
import { TrashIcon } from "@/components/Icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import ActionButton from "@/components/form/ActionButton";
import { format, isValid, parseISO } from "date-fns"; // Import isValid and parseISO

interface WeightLogListProps {
  isBulkConfirmModalOpen?: boolean;
  onBulkConfirm?: () => void;
  onBulkCancel?: () => void;
}

function WeightLogList({
  isBulkConfirmModalOpen = false,
  onBulkConfirm,
  onBulkCancel = () => {},
}: WeightLogListProps) {
  const weightLog = useStore((state) => state.weightLog); // Now contains { id, timestamp, weight }
  const deleteWeightLogEntry = useStore((state) => state.deleteWeightLogEntry);
  // Try to get a bulk delete action if it exists
  // No bulk delete in store, will fallback to per-entry deletion
  const isLoading = useStore((state) => state.isLoading);
  const isSaving = useStore((state) => state.isSaving);

  // State for confirmation modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  // Update state type to use timestamp
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    timestamp: string; // Changed from date
    weight: number;
  } | null>(null);

  // Opens the confirmation modal - use timestamp
  const handleDeleteClick = (id: string, timestamp: string, weight: number) => {
    setItemToDelete({ id, timestamp, weight });
    setIsConfirmModalOpen(true);
  };

  // Opens the bulk delete confirmation modal (no longer used)

  // Handles the actual deletion after confirmation
  const handleConfirmDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault(); // Prevent accidental form submit/page reload
    if (!itemToDelete) return;

    try {
      await deleteWeightLogEntry(itemToDelete.id);
    } catch (error) {
      console.error("Deletion failed from component:", error);
    } finally {
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  // Handles bulk deletion after confirmation
  const handleConfirmBulkDelete = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      // Fallback: delete entries one by one
      for (const entry of weightLog) {
        await deleteWeightLogEntry(entry.id);
      }
    } catch (error) {
      console.error("Bulk deletion failed:", error);
    } finally {
      onBulkCancel();
    }
  };

  // Closes the confirmation modal without deleting
  const handleCancelDelete = () => {
    setIsConfirmModalOpen(false);
    setItemToDelete(null);
  };

  // Sort log by timestamp descending for display
  const sortedLog = useMemo(() => {
    return [...weightLog]
      .filter((entry) => entry.timestamp && isValid(parseISO(entry.timestamp))) // Filter out invalid timestamps first
      .sort(
        (a, b) =>
          parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime()
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
                  size="sm"
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
                        entry.weight
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
            1
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
          message={`Are you sure you want to delete ALL weight log entries? This action cannot be undone.`}
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

import React, { useState, useMemo } from "react";
import { useStore } from "@/store/store";
import { TrashIcon } from "@/components/Icons";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import { format, isValid, parseISO } from "date-fns"; // Import isValid and parseISO

function WeightLogList() {
  const weightLog = useStore((state) => state.weightLog); // Now contains { id, timestamp, weight }
  const deleteWeightLogEntry = useStore((state) => state.deleteWeightLogEntry);
  const isLoading = useStore((state) => state.isLoading);
  const isSaving = useStore((state) => state.isSaving);

  // State for confirmation modal
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

  // Handles the actual deletion after confirmation
  const handleConfirmDelete = async () => {
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
        <LoadingSpinner className="h-8 w-8 text-indigo-400" />
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
                className="py-3 flex items-center justify-between"
              >
                <div>
                  <span className="text-gray-300 text-sm">
                    {/* Format timestamp only if valid */}
                    {isValidDate
                      ? format(entryDate, "MMM d, yyyy 'at' p")
                      : "Invalid Date"}
                  </span>
                  <span className="ml-4 font-semibold text-indigo-300">
                    {entry.weight.toFixed(1)} kg
                  </span>
                </div>
                <button
                  onClick={() =>
                    // Pass timestamp only if valid
                    isValidDate &&
                    handleDeleteClick(entry.id, entry.timestamp, entry.weight)
                  }
                  disabled={isSaving || !isValidDate} // Disable if saving or date is invalid
                  className={`p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 transition-colors duration-150 ${
                    (isSaving && itemToDelete?.id === entry.id) || !isValidDate
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  aria-label={
                    isValidDate
                      ? `Delete entry from ${format(entryDate, "PPPp")}`
                      : "Cannot delete entry with invalid date"
                  }
                >
                  {isSaving && itemToDelete?.id === entry.id ? (
                    <LoadingSpinner className="h-4 w-4" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Confirmation Modal - Update message to use timestamp */}
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
          isLoading={isSaving}
        />
      )}
    </>
  );
}

export default WeightLogList;

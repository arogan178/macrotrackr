import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { DateField, NumberField, FormButton } from "@/components/form";
import { useStore } from "@/store/store";
import { AddWeightLogPayload } from "@/utils/api-service"; // Assuming this path alias works
import LoadingSpinner from "@/components/LoadingSpinner";
import { getErrorMessage } from "@/utils/error-handling"; // Import error handler
import { USER_MAXIMUM_WEIGHT, USER_MINIMUM_WEIGHT } from "@/utils/constants";

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number | null; // Optional initial weight to pre-fill
}

function LogWeightModal({
  isOpen,
  onClose,
  initialWeight,
}: LogWeightModalProps) {
  // Select state and actions individually to prevent unnecessary re-renders
  const addWeightLogEntry = useStore((state) => state.addWeightLogEntry);
  const isSaving = useStore((state) => state.isSaving);
  const error = useStore((state) => state.error); // Use the error state from the goals slice
  const clearError = useStore((state) => state.clearError);

  const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
  const [date, setDate] = useState<string>(today); // Default to today
  const [weight, setWeight] = useState<number | string>(initialWeight || "");
  const [formError, setFormError] = useState<string | null>(null);

  // Reset form and clear errors when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setDate(today); // Reset to today on open
      setWeight(initialWeight || "");
      setFormError(null);
      // Check if clearError is defined before calling
      if (clearError) {
        clearError(); // Clear store error as well
      }
    }
    // Keep clearError in dependency array if it might change, though it usually shouldn't
  }, [isOpen, initialWeight, clearError, today]); // Add today to dependencies

  function validateForm(): boolean {
    setFormError(null); // Clear previous error

    // Date validation (redundant if max is set, but good practice)
    if (!date) {
      setFormError("Date is required.");
      return false;
    }
    if (date > today) {
      setFormError("Date cannot be in the future.");
      return false;
    }

    // Weight validation
    const weightNum = Number(weight);
    if (isNaN(weightNum)) {
      setFormError("Please enter a valid weight.");
      return false;
    }
    if (weightNum < USER_MINIMUM_WEIGHT) {
      setFormError(`Weight must be at least ${USER_MINIMUM_WEIGHT} kg.`);
      return false;
    }
    if (weightNum > USER_MAXIMUM_WEIGHT) {
      setFormError(`Weight cannot exceed ${USER_MAXIMUM_WEIGHT} kg.`);
      return false;
    }

    return true; // Validation passed
  }

  // Refined handleSubmit
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError(); // Clear previous store errors
    // setFormError(null); // Moved clearing to validateForm

    if (!validateForm()) {
      return; // Validation failed, formError is set
    }

    const payload: AddWeightLogPayload = {
      date,
      weight: Number(weight),
    };

    try {
      await addWeightLogEntry(payload);
      // If addWeightLogEntry resolves without throwing, assume success
      onClose(); // Close modal
    } catch (err) {
      // If addWeightLogEntry throws, the slice should set the error state.
      // The component will re-render with the new 'error' from the store.
      // We can log the error here for debugging.
      console.error("Failed to add weight log entry:", err);
      // Optionally set a local error message based on the caught error
      // setFormError(getErrorMessage(err));
      // However, relying on the store's error state is often cleaner.
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Your Weight">
      <form onSubmit={handleSubmit} className="space-y-4">
        <DateField
          label="Date"
          id="log-date"
          value={date}
          onChange={(e) => setDate(e)}
          required
          disabled={isSaving}
          max={today} // Set max attribute to prevent future dates
        />
        <NumberField
          label="Weight (kg)"
          id="log-weight"
          value={weight}
          // Correctly handle the value passed by NumberField's onChange
          onChange={(newValue) =>
            setWeight(newValue === undefined ? "" : newValue)
          }
          required
          min={USER_MINIMUM_WEIGHT} // Set min attribute for browser validation hint
          max={USER_MAXIMUM_WEIGHT} // Set max attribute for browser validation hint
          step={0.1}
          placeholder={`e.g., 75.5 (between ${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`}
          disabled={isSaving}
        />

        {/* Display validation (formError) or API errors (error from store) */}
        {(formError || error) && (
          <p className="text-sm text-red-400">{formError || error}</p>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <FormButton
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </FormButton>
          <FormButton type="submit" disabled={isSaving}>
            {isSaving ? <LoadingSpinner size="sm" /> : "Save Log"}
          </FormButton>
        </div>
      </form>
    </Modal>
  );
}

export default LogWeightModal;

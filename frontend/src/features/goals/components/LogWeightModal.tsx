import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
// Import TimeField
import {
  DateField,
  NumberField,
  FormButton,
  TimeField,
} from "@/components/form";
import { useStore } from "@/store/store";
import { AddWeightLogPayload } from "@/utils/api-service";
import LoadingSpinner from "@/components/LoadingSpinner";
import { getErrorMessage } from "@/utils/error-handling";
import { USER_MAXIMUM_WEIGHT, USER_MINIMUM_WEIGHT } from "@/utils/constants";
import { format, parse, isValid } from "date-fns"; // Import date-fns helpers

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number | null;
}

// Helper to get current time in HH:mm format
function getCurrentTime(): string {
  return format(new Date(), "HH:mm");
}

function LogWeightModal({
  isOpen,
  onClose,
  initialWeight,
}: LogWeightModalProps) {
  const addWeightLogEntry = useStore((state) => state.addWeightLogEntry);
  const isSaving = useStore((state) => state.isSaving);
  const error = useStore((state) => state.error);
  const clearError = useStore((state) => state.clearError);

  const today = format(new Date(), "yyyy-MM-dd"); // Use date-fns format
  const nowTime = getCurrentTime();

  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(nowTime); // Add state for time
  const [weight, setWeight] = useState<number | string>(initialWeight || "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentDateTime = new Date();
      setDate(format(currentDateTime, "yyyy-MM-dd")); // Reset date to today
      setTime(format(currentDateTime, "HH:mm")); // Reset time to now
      setWeight(initialWeight || "");
      setFormError(null);
      if (clearError) {
        clearError();
      }
    }
  }, [isOpen, initialWeight, clearError]); // Removed today, nowTime as they are derived inside

  function validateForm(): boolean {
    setFormError(null);

    // Combine date and time for validation
    const dateTimeString = `${date}T${time}:00`; // Add seconds for parsing
    const parsedDateTime = parse(
      dateTimeString,
      "yyyy-MM-dd'T'HH:mm:ss",
      new Date()
    );

    if (!isValid(parsedDateTime)) {
      setFormError("Invalid date or time selected.");
      return false;
    }

    if (parsedDateTime > new Date()) {
      setFormError("Date and time cannot be in the future.");
      return false;
    }

    // Weight validation (remains the same)
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

    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    clearError();

    if (!validateForm()) {
      return;
    }

    // Combine date and time into an ISO 8601 string
    // Note: This creates a string based on local time. The backend should ideally store it as UTC.
    // For simplicity here, we send the local time ISO string.
    const localDateTime = parse(
      `${date} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    const timestamp = localDateTime.toISOString(); // Convert to ISO string (includes timezone offset)

    const payload: AddWeightLogPayload = {
      timestamp: timestamp, // Use the combined timestamp
      weight: Number(weight),
    };

    try {
      await addWeightLogEntry(payload);
      onClose();
    } catch (err) {
      console.error("Failed to add weight log entry:", err);
      // Error state is handled by the slice
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Your Weight">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DateField
            label="Date"
            id="log-date"
            value={date}
            onChange={(newDate) => setDate(newDate)} // Assuming DateField returns string
            required
            disabled={isSaving}
            max={today}
          />
          {/* Add TimeField */}
          <TimeField
            label="Time"
            id="log-time"
            value={time}
            onChange={(newTime) => setTime(newTime)} // Assuming TimeField returns string HH:mm
            required
            disabled={isSaving}
          />
        </div>
        <NumberField
          label="Weight (kg)"
          id="log-weight"
          value={weight}
          onChange={(newValue) =>
            setWeight(newValue === undefined ? "" : newValue)
          }
          required
          min={USER_MINIMUM_WEIGHT}
          max={USER_MAXIMUM_WEIGHT}
          step={0.1}
          placeholder={`e.g., 75.5 (between ${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`}
          disabled={isSaving}
        />

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

import { useState, useEffect } from "react";
import Modal from "@/components/form/Modal";
import { DateField, NumberField, TimeField } from "@/components/form";
import { useStore } from "@/store/store";
import { AddWeightLogPayload } from "@/utils/api-service";
import { USER_MAXIMUM_WEIGHT, USER_MINIMUM_WEIGHT } from "@/utils/constants";
import { format, parse, isValid } from "date-fns";

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number | null;
}

// Helper to get current time in HH:mm format
const getCurrentTime = () => format(new Date(), "HH:mm");

function LogWeightModal({
  isOpen,
  onClose,
  initialWeight,
}: LogWeightModalProps) {
  const addWeightLogEntry = useStore((state) => state.addWeightLogEntry);
  const isSaving = useStore((state) => state.isSaving);
  const error = useStore((state) => state.error);
  const clearError = useStore((state) => state.clearError);

  const today = format(new Date(), "yyyy-MM-dd");
  const nowTime = getCurrentTime();

  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(nowTime);
  const [weight, setWeight] = useState<number | string>(initialWeight || "");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const currentDateTime = new Date();
      setDate(format(currentDateTime, "yyyy-MM-dd"));
      setTime(format(currentDateTime, "HH:mm"));
      setWeight(initialWeight || "");
      setFormError(null);
      if (clearError) clearError();
    }
  }, [isOpen, initialWeight, clearError]);

  // Validation logic for Save button
  function validateForm(): boolean {
    setFormError(null);
    const dateTimeString = `${date}T${time}:00`;
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

  // Handler for Modal's onSave
  async function handleSave() {
    clearError();
    if (!validateForm()) return;
    const localDateTime = parse(
      `${date} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date()
    );
    const timestamp = localDateTime.toISOString();
    const payload: AddWeightLogPayload = { timestamp, weight: Number(weight) };
    try {
      await addWeightLogEntry(payload);
      onClose();
    } catch (err) {
      // Error state is handled by the slice
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Your Weight"
      variant="form"
      onSave={handleSave}
      saveDisabled={isSaving || !date || !time || !weight || !!formError}
      saveLabel="Log Weight"
      buttonSize="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DateField label="Date" value={date} onChange={setDate} required />
          <TimeField label="Time" value={time} onChange={setTime} required />
        </div>
        <NumberField
          label="Weight (kg)"
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
      </div>
    </Modal>
  );
}

export default LogWeightModal;

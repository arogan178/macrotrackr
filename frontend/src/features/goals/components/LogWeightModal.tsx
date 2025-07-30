import { format, isValid, parse } from "date-fns";
import { useEffect, useState } from "react";

import { DateField, NumberField, TimeField } from "@/components/form";
import Modal from "@/components/ui/Modal";
import { useAddWeightLogEntry } from "@/hooks/queries/useGoals";
import { AddWeightLogPayload } from "@/utils/apiServices";
import { USER_MAXIMUM_WEIGHT, USER_MINIMUM_WEIGHT } from "@/utils/constants";

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number | undefined;
}

// Helper to get current time in HH:mm format
const getCurrentTime = () => format(new Date(), "HH:mm");

function LogWeightModal({
  isOpen,
  onClose,
  initialWeight,
}: LogWeightModalProps) {
  const addWeightLogMutation = useAddWeightLogEntry();

  const today = format(new Date(), "yyyy-MM-dd");
  const nowTime = getCurrentTime();

  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(nowTime);
  const [weight, setWeight] = useState<number | string>(initialWeight || "");
  const [formError, setFormError] = useState<string | undefined>();

  // Clear form error when inputs change
  const handleDateChange = (value: string) => {
    setDate(value);
    if (formError) setFormError(undefined);
  };

  const handleTimeChange = (value: string) => {
    setTime(value);
    if (formError) setFormError(undefined);
  };

  const handleWeightChange = (value: number | undefined) => {
    setWeight(value === undefined ? "" : value);
    if (formError) setFormError(undefined);
  };

  useEffect(() => {
    if (isOpen) {
      const currentDateTime = new Date();
      setDate(format(currentDateTime, "yyyy-MM-dd"));
      setTime(format(currentDateTime, "HH:mm"));
      setWeight(initialWeight || "");
      setFormError(undefined);
    }
  }, [isOpen, initialWeight]);

  // Validation logic for Save button
  function validateForm(): boolean {
    setFormError(undefined);
    const dateTimeString = `${date}T${time}:00`;
    const parsedDateTime = parse(
      dateTimeString,
      "yyyy-MM-dd'T'HH:mm:ss",
      new Date(),
    );
    if (!isValid(parsedDateTime)) {
      setFormError("Invalid date or time selected.");
      return false;
    }
    if (parsedDateTime > new Date()) {
      setFormError("Date and time cannot be in the future.");
      return false;
    }
    const weightNumber = Number(weight);
    if (Number.isNaN(weightNumber)) {
      setFormError("Please enter a valid weight.");
      return false;
    }
    if (weightNumber < USER_MINIMUM_WEIGHT) {
      setFormError(`Weight must be at least ${USER_MINIMUM_WEIGHT} kg.`);
      return false;
    }
    if (weightNumber > USER_MAXIMUM_WEIGHT) {
      setFormError(`Weight cannot exceed ${USER_MAXIMUM_WEIGHT} kg.`);
      return false;
    }
    return true;
  }

  // Handler for Modal's onSave
  async function handleSave() {
    if (!validateForm()) return;
    const localDateTime = parse(
      `${date} ${time}`,
      "yyyy-MM-dd HH:mm",
      new Date(),
    );
    const timestamp = localDateTime.toISOString();
    const payload: AddWeightLogPayload = { timestamp, weight: Number(weight) };
    try {
      await addWeightLogMutation.mutateAsync(payload);
      onClose();
    } catch {
      // Error state is handled by the mutation hook
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Your Weight"
      variant="form"
      onSave={handleSave}
      saveDisabled={
        addWeightLogMutation.isPending ||
        !date ||
        !time ||
        !weight ||
        !!formError
      }
      saveLabel="Log Weight"
      buttonSize="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <DateField
            label="Date"
            value={date}
            onChange={handleDateChange}
            required
          />
          <TimeField
            label="Time"
            value={time}
            onChange={handleTimeChange}
            required
          />
        </div>
        <NumberField
          label="Weight (kg)"
          value={weight}
          onChange={handleWeightChange}
          required
          min={USER_MINIMUM_WEIGHT}
          max={USER_MAXIMUM_WEIGHT}
          step={0.1}
          placeholder={`e.g., 75.5 (between ${USER_MINIMUM_WEIGHT}-${USER_MAXIMUM_WEIGHT} kg)`}
          disabled={addWeightLogMutation.isPending}
        />
        {formError && <p className="text-sm text-vibrant-accent">{formError}</p>}
      </div>
    </Modal>
  );
}

export default LogWeightModal;

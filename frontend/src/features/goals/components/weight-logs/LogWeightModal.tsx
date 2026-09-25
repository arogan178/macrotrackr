import { useEffect, useState } from "react";
import { format, isValid, parse, parseISO } from "date-fns";

import type { AddWeightLogPayload, WeightLogEntry } from "@/api/goals";
import DateField from "@/components/form/DateField";
import TimeField from "@/components/form/TimeField";
import WeightField from "@/components/form/WeightField";
import Modal from "@/components/ui/Modal";
import {
  useAddWeightLogEntry,
  useUpdateWeightLogEntry,
} from "@/hooks/queries/useGoals";
import { USER_MAXIMUM_WEIGHT, USER_MINIMUM_WEIGHT } from "@/utils/constants";
import {
  type UnitSystem,
  weightLimits,
  weightUnit,
} from "@/utils/unitConversion";

interface LogWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialWeight?: number | undefined;
  unitSystem?: UnitSystem;
  /** Opens the modal on this entry and saves over it. */
  entry?: WeightLogEntry;
}

// Helper to get current time in HH:mm format
const getCurrentTime = () => format(new Date(), "HH:mm");

function LogWeightModal({
  isOpen,
  onClose,
  initialWeight,
  unitSystem = "metric",
  entry,
}: LogWeightModalProps) {
  const unit = weightUnit(unitSystem);
  const limits = weightLimits(
    USER_MINIMUM_WEIGHT,
    USER_MAXIMUM_WEIGHT,
    unitSystem,
  );
  const addWeightLogMutation = useAddWeightLogEntry();
  const updateWeightLogMutation = useUpdateWeightLogEntry();
  const isPending =
    addWeightLogMutation.isPending || updateWeightLogMutation.isPending;

  const today = format(new Date(), "yyyy-MM-dd");
  const nowTime = getCurrentTime();

  const [date, setDate] = useState<string>(today);
  const [time, setTime] = useState<string>(nowTime);
  const [weight, setWeight] = useState<number | string>(initialWeight ?? "");
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
    setWeight(value ?? "");
    if (formError) setFormError(undefined);
  };

  useEffect(() => {
    if (isOpen) {
      const dateTime = entry ? parseISO(entry.timestamp) : new Date();
      setDate(format(dateTime, "yyyy-MM-dd"));
      setTime(format(dateTime, "HH:mm"));
      setWeight(entry?.weight ?? initialWeight ?? "");
      setFormError(undefined);
    }
  }, [isOpen, initialWeight, entry]);

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
      setFormError(`Weight must be at least ${limits.min} ${unit}.`);

      return false;
    }
    if (weightNumber > USER_MAXIMUM_WEIGHT) {
      setFormError(`Weight cannot exceed ${limits.max} ${unit}.`);

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
      await (entry
        ? updateWeightLogMutation.mutateAsync({ ...payload, id: entry.id })
        : addWeightLogMutation.mutateAsync(payload));
      onClose();
    } catch {
      // Error state is handled by the mutation hook
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={entry ? "Edit Weight Entry" : "Log Your Weight"}
      variant="form"
      onSave={handleSave}
      saveDisabled={
        isPending ||
        !date ||
        !time ||
        !weight ||
        !!formError
      }
      saveLabel={entry ? "Save Changes" : "Log Weight"}
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
        <WeightField
          label="Weight"
          value={weight === "" ? undefined : Number(weight)}
          onChange={handleWeightChange}
          required
          unitSystem={unitSystem}
          minKg={USER_MINIMUM_WEIGHT}
          maxKg={USER_MAXIMUM_WEIGHT}
          placeholder={`Between ${limits.min}-${limits.max} ${unit}`}
          disabled={isPending}
        />
        {formError && <p className="text-sm text-error">{formError}</p>}
      </div>
    </Modal>
  );
}

export default LogWeightModal;

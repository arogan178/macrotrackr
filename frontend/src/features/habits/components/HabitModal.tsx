import { useCallback, useEffect, useState } from "react";

import Modal from "@/components/ui/Modal";
import { useMutationErrorHandler } from "@/hooks";

import { HabitGoal, HabitGoalFormValues } from "../types/types";
import HabitForm from "./HabitForm";

// Default values for a new habit
const DEFAULT_HABIT_VALUES: HabitGoalFormValues = {
  title: "",
  iconName: "target",
  target: 10,
  accentColor: "indigo",
};

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: HabitGoalFormValues, habitId?: string) => Promise<void>;
  habit?: HabitGoal | undefined;
  mode: "add" | "edit";
}

function HabitModal({
  isOpen,
  onClose,
  onSubmit,
  habit,
  mode,
}: HabitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // State lifted from HabitForm
  const [formValues, setFormValues] =
    useState<HabitGoalFormValues>(DEFAULT_HABIT_VALUES);
  const [errors, setErrors] = useState<
    Partial<Record<keyof HabitGoalFormValues, string>>
  >({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Use new mutation error handling
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) =>
        console.error("Habit modal operation failed:", message),
      onSuccess: (message) =>
        console.log("Habit modal operation succeeded:", message),
    });

  const isEditMode = mode === "edit";

  // Validation function
  const validateForm = useCallback((values: HabitGoalFormValues) => {
    const newErrors: Partial<Record<keyof HabitGoalFormValues, string>> = {};
    if (!values.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (values.target <= 0) {
      newErrors.target = "Target must be greater than 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, []);

  // Initialize/Reset form state when modal opens or habit/mode changes
  useEffect(() => {
    if (isOpen) {
      let initialValues = DEFAULT_HABIT_VALUES;
      if (isEditMode && habit) {
        initialValues = {
          title: habit.title,
          iconName: habit.iconName,
          target: habit.target,
          accentColor: habit.accentColor || "indigo",
        };
      }
      setFormValues(initialValues);
      setIsFormValid(validateForm(initialValues)); // Validate initial values
      setErrors({}); // Clear previous errors
      setIsSubmitting(false); // Reset submitting state
    } else {
      // Optionally reset when closing, though key prop might handle this
      // setFormValues(DEFAULT_HABIT_VALUES);
      // setErrors({});
      // setIsFormValid(false);
    }
  }, [isOpen, habit, mode, isEditMode, validateForm]);

  // Handler passed down to HabitForm
  const handleFormChange = (
    field: keyof HabitGoalFormValues,
    value: string | number,
  ) => {
    setFormValues((previousValues) => {
      const newValues = { ...previousValues, [field]: value };
      setIsFormValid(validateForm(newValues)); // Re-validate on change
      return newValues;
    });
  };

  const handleSave = async () => {
    if (!isFormValid || isSubmitting) return;
    if (isEditMode && !habit) return; // Should not happen if logic is correct

    setIsSubmitting(true);
    try {
      await onSubmit(formValues, isEditMode ? habit?.id : undefined);
      handleMutationSuccess(
        `Habit ${isEditMode ? "updated" : "created"} successfully!`,
      );
      // onSubmit handles closing the modal, so we don't call onClose() here
    } catch (error) {
      handleMutationError(
        error,
        `${isEditMode ? "updating" : "creating"} habit`,
      );
      // Reset submitting state on error so user can try again
      setIsSubmitting(false);
    }
    // Note: We don't reset isSubmitting on success because the modal will close
    // and the component will unmount/reset when it reopens
  };

  // Determine the title and save button label based on the mode
  const modalTitle = isEditMode ? "Edit Habit" : "Add New Habit";
  const saveLabel = isSubmitting
    ? "Saving..."
    : isEditMode
      ? "Save Changes"
      : "Save Habit";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose} // Use the original onClose prop
      title={modalTitle}
      size="md"
      variant="form"
      onSave={handleSave}
      saveDisabled={!isFormValid || isSubmitting}
      saveLabel={saveLabel}
    >
      {/* Pass state and handlers down to the controlled HabitForm */}
      <HabitForm
        values={formValues}
        onChange={handleFormChange}
        errors={errors}
        // Pass the current progress from the original habit when editing
        currentProgress={isEditMode ? habit?.current : 0}
      />
    </Modal>
  );
}

export default HabitModal;

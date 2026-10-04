import { useEffect } from "react";
import { useStore as useFormStore } from "@tanstack/react-form";

import Modal from "@/components/ui/Modal";
import { useMutationErrorHandler } from "@/hooks";
import { useStore } from "@/store/store";
import { HabitGoal, HabitGoalFormValues } from "@/types/habit";

import HabitForm, { useHabitForm, validateTitle } from "./HabitForm";

// Default values for a new habit
const DEFAULT_HABIT_VALUES: HabitGoalFormValues = {
  title: "",
  iconName: "target",
  target: 10,
  accentColor: "indigo",
  frequency: "daily",
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
  const { showNotification } = useStore();

  // Use new mutation error handling
  const { handleMutationError } =
    useMutationErrorHandler({
      onError: (message) => showNotification(message, "error"),
      onSuccess: (message) => showNotification(message, "success"),
    });

  const isEditMode = mode === "edit";

  const form = useHabitForm(DEFAULT_HABIT_VALUES, async (values) => {
    if (isEditMode && !habit) return; // Should not happen if logic is correct
    try {
      await onSubmit(values, isEditMode ? habit?.id : undefined);
    } catch (error) {
      handleMutationError(
        error,
        `${isEditMode ? "updating" : "creating"} habit`,
      );
    }
  });
  const formValues = useFormStore(form.store, (state) => state.values);
  const isSubmitting = useFormStore(form.store, (state) => state.isSubmitting);
  // Not onMount validation: that runs once, and this form is reused for every opening.
  const isFormValid = !validateTitle({ value: formValues.title });

  useEffect(() => {
    if (!isOpen) return;
    // keepDefaultValues: otherwise the next render puts the add-mode defaults back.
    form.reset(
      isEditMode && habit
        ? {
            title: habit.title,
            iconName: habit.iconName,
            target: habit.target,
            accentColor: habit.accentColor ?? "indigo",
            frequency: habit.frequency ?? "daily",
          }
        : DEFAULT_HABIT_VALUES,
      { keepDefaultValues: true },
    );
  }, [isOpen, habit, isEditMode, form]);

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
      onSave={() => void form.handleSubmit()}
      saveDisabled={!isFormValid || isSubmitting}
      saveLabel={saveLabel}
    >
      <HabitForm
        form={form}
        // Switching frequency restarts progress, so the preview does too
        currentProgress={
          isEditMode &&
          formValues.frequency === (habit?.frequency ?? "daily")
            ? habit?.current
            : 0
        }
      />
    </Modal>
  );
}

export default HabitModal;

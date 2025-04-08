import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { HabitGoal, HabitGoalFormValues } from "../types";
import HabitForm from "./HabitForm";

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: HabitGoalFormValues, habitId?: string) => Promise<void>;
  habit?: HabitGoal | null;
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
  const [formValues, setFormValues] = useState<HabitGoalFormValues | null>(
    null
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const isEditMode = mode === "edit";

  // Convert habit to form values when opened in edit mode
  useEffect(() => {
    if (isEditMode && habit) {
      const initialValues: HabitGoalFormValues = {
        title: habit.title,
        iconName: habit.iconName,
        target: habit.target,
        accentColor: habit.accentColor || "indigo",
      };
      setFormValues(initialValues);
    }
  }, [habit, isEditMode]);

  const handleFormChange = (values: HabitGoalFormValues, valid: boolean) => {
    setFormValues(values);
    setIsFormValid(valid);
  };

  const handleSave = async () => {
    if (!formValues || !isFormValid) return;
    if (isEditMode && !habit) return;

    setIsSubmitting(true);
    try {
      // In edit mode, pass the habit ID; in add mode, just pass the values
      await onSubmit(formValues, isEditMode ? habit?.id : undefined);
      onClose();
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "submitting"} habit:`,
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine the title and save button label based on the mode
  const modalTitle = isEditMode ? "Edit Habit" : "Add New Habit";
  const saveLabel = isSubmitting
    ? "Saving..."
    : isEditMode
    ? "Save Changes"
    : "Save Habit";

  const handleClose = isSubmitting ? () => {} : onClose;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size="md"
      variant="form"
      onSave={handleSave}
      saveDisabled={!isFormValid || isSubmitting}
      saveLabel={saveLabel}
    >
      <HabitForm
        initialValues={formValues || undefined}
        onChange={handleFormChange}
        hideButtons
      />
    </Modal>
  );
}

export default HabitModal;

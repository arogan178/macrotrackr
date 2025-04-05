import { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { HabitGoal, HabitGoalFormValues } from "../types";
import HabitForm from "./HabitForm";

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, values: HabitGoalFormValues) => Promise<void>;
  habit: HabitGoal | null;
}

function EditHabitModal({
  isOpen,
  onClose,
  onSubmit,
  habit,
}: EditHabitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<HabitGoalFormValues | null>(
    null
  );
  const [isFormValid, setIsFormValid] = useState(false);

  // Convert habit to form values when opened
  useEffect(() => {
    if (habit) {
      const initialValues: HabitGoalFormValues = {
        title: habit.title,
        iconName: habit.iconName,
        target: habit.target,
        accentColor: habit.accentColor || "indigo",
      };
      setFormValues(initialValues);
    }
  }, [habit]);

  const handleFormChange = (values: HabitGoalFormValues, valid: boolean) => {
    setFormValues(values);
    setIsFormValid(valid);
  };

  const handleSave = async () => {
    if (!formValues || !isFormValid || !habit) return;

    setIsSubmitting(true);
    try {
      await onSubmit(habit.id, formValues);
      onClose();
    } catch (error) {
      console.error("Error updating habit goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isSubmitting ? onClose : undefined}
      title="Edit Habit Goal"
      size="md"
      variant="form"
      onSave={handleSave}
      saveDisabled={!isFormValid || isSubmitting}
      saveLabel={isSubmitting ? "Saving..." : "Save Changes"}
    >
      <HabitForm
        initialValues={formValues || undefined}
        onChange={handleFormChange}
        isSubmitting={isSubmitting}
        hideButtons
      />
    </Modal>
  );
}

export default EditHabitModal;

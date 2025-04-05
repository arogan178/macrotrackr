import { useState } from "react";
import Modal from "@/components/Modal";
import { HabitGoalFormValues } from "../types";
import HabitForm from "./HabitForm";

interface AddHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: HabitGoalFormValues) => Promise<void>;
}

function AddHabitModal({ isOpen, onClose, onSubmit }: AddHabitModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<HabitGoalFormValues | null>(
    null
  );
  const [isFormValid, setIsFormValid] = useState(false);

  const handleFormChange = (values: HabitGoalFormValues, valid: boolean) => {
    setFormValues(values);
    setIsFormValid(valid);
  };

  const handleSave = async () => {
    if (!formValues || !isFormValid) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formValues);
      onClose();
    } catch (error) {
      console.error("Error submitting habit goal:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!isSubmitting ? onClose : undefined}
      title="Add New Habit Goal"
      size="md"
      variant="form"
      onSave={handleSave}
      saveDisabled={!isFormValid || isSubmitting}
      saveLabel={isSubmitting ? "Saving..." : "Save Habit"}
    >
      <HabitForm onChange={handleFormChange} isSubmitting={isSubmitting} />
    </Modal>
  );
}

export default AddHabitModal;

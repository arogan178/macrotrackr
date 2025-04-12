import Modal from "@/components/Modal";
import WeightGoalForm from "./WeightGoalForm";
import { WeightGoalFormValues, WeightGoals } from "../types";
import { useEffect } from "react"; // Add useEffect for logging

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: WeightGoalFormValues) => void;
  currentWeight: number;
  targetWeight?: number; // Optional initial target weight
  tdee: number;
  weightGoals: WeightGoals | null; // Pass existing goals for editing
  isLoading?: boolean; // Loading state for the save button
}

function WeightGoalModal({
  isOpen,
  onClose,
  onSave,
  currentWeight,
  targetWeight,
  tdee,
  weightGoals,
  isLoading = false,
}: WeightGoalModalProps) {
  // Add log to see if the component renders and receives the correct isOpen prop
  useEffect(() => {
    if (isOpen) {
      console.log("WeightGoalModal rendered and open."); // DEBUG
    }
  }, [isOpen]);

  const handleSave = (values: WeightGoalFormValues) => {
    onSave(values);
    // Modal closure is handled in GoalsPage
  };

  return (
    <Modal
      isOpen={isOpen} // Passed to the base Modal
      onClose={onClose}
      title={weightGoals ? "Edit Weight Goal" : "Set Weight Goal"}
      variant="form"
      hideDefaultButtons={true}
      size="lg"
    >
      <WeightGoalForm
        currentWeight={currentWeight}
        targetWeight={weightGoals?.targetWeight ?? targetWeight}
        tdee={tdee}
        weightGoals={weightGoals}
        isLoading={isLoading}
        onSave={handleSave}
        onCancel={onClose}
      />
    </Modal>
  );
}

export default WeightGoalModal;

import Modal from "@/components/Modal";
import WeightGoalForm from "./WeightGoalForm";
import { WeightGoalFormValues, WeightGoals } from "../types";
import { useEffect } from "react"; // Add useEffect for logging

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: WeightGoalFormValues) => void;
  startingWeight: number;
  targetWeight?: number; // Optional initial target weight
  tdee: number;
  weightGoals: WeightGoals | null; // Pass existing goals for editing
  isLoading?: boolean; // Loading state for the save button
}

function WeightGoalModal({
  isOpen,
  onClose,
  onSave,
  startingWeight,
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

  // Provide a default value for targetWeight if it's undefined
  const initialTargetWeight =
    weightGoals?.targetWeight ?? targetWeight ?? startingWeight;

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
        startingWeight={startingWeight}
        targetWeight={initialTargetWeight} // Use the calculated initial value
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

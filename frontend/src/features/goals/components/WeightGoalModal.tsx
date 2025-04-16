import Modal from "@/components/Modal";
import WeightGoalForm from "./WeightGoalForm";
import { WeightGoalFormValues, WeightGoals } from "../types";
import { useEffect } from "react";
import { useStore } from "@/store/store"; // Import useStore

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  // onSave: (values: WeightGoalFormValues) => void; // REMOVED - Handled internally now
  startingWeight: number;
  targetWeight?: number;
  tdee: number;
  weightGoals: WeightGoals | null; // Used to determine create vs update
  // isLoading?: boolean; // REMOVED - Get from store
}

function WeightGoalModal({
  isOpen,
  onClose,
  // onSave, // REMOVED
  startingWeight,
  targetWeight,
  tdee,
  weightGoals, // Keep this to know if editing
}: // isLoading = false, // REMOVED
WeightGoalModalProps) {
  // Get actions and state from store
  const createWeightGoal = useStore((state) => state.createWeightGoal);
  const updateWeightGoal = useStore((state) => state.updateWeightGoal);
  const isSaving = useStore((state) => state.isSaving); // Get saving state

  useEffect(() => {
    if (isOpen) {
      console.log("WeightGoalModal rendered and open.");
    }
  }, [isOpen]);

  const handleSave = async (values: WeightGoalFormValues) => {
    try {
      if (weightGoals) {
        // If weightGoals exists, we are updating
        await updateWeightGoal(values, tdee);
      } else {
        // Otherwise, we are creating
        await createWeightGoal(values, tdee);
      }
      onClose(); // Close modal on success
    } catch (error) {
      // Error is handled and displayed by the slice/notification system
      console.error("Save failed in WeightGoalModal:", error);
      // Optionally keep modal open on error, or handle specific errors
    }
  };

  const initialTargetWeight =
    weightGoals?.targetWeight ?? targetWeight ?? startingWeight;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={weightGoals ? "Edit Weight Goal" : "Set Weight Goal"}
      variant="form"
      hideDefaultButtons={true}
      size="lg"
    >
      <WeightGoalForm
        startingWeight={startingWeight}
        targetWeight={initialTargetWeight}
        tdee={tdee}
        weightGoals={weightGoals} // Pass existing goals to form for disabling startingWeight
        isLoading={isSaving} // Pass saving state from store
        onSave={handleSave} // Pass the correct handler
        onCancel={onClose}
      />
    </Modal>
  );
}

export default WeightGoalModal;

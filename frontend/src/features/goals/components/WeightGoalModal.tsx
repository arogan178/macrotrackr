import { useEffect } from "react";

import Modal from "@/components/ui/Modal";
import { useStore } from "@/store/store"; // Import useStore
import type { WeightGoals } from "@/types/goal";
import { useRouter } from "@tanstack/react-router";

import { WeightGoalFormValues } from "../types";
import WeightGoalForm from "./WeightGoalForm";

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  startingWeight: number;
  targetWeight?: number;
  tdee: number;
  weightGoals: WeightGoals | undefined; // Used to determine create vs update
}

function WeightGoalModal({
  isOpen,
  onClose,
  startingWeight,
  targetWeight,
  tdee,
  weightGoals,
}: WeightGoalModalProps) {
  // Get actions and state from store
  const createWeightGoal = useStore((state) => state.createWeightGoal);
  const updateWeightGoal = useStore((state) => state.updateWeightGoal);
  const isSaving = useStore((state) => state.isSaving); // Get saving state
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      console.log("WeightGoalModal rendered and open.");
    }
  }, [isOpen]);

  const handleSave = async (values: WeightGoalFormValues) => {
    try {
      await (weightGoals
        ? updateWeightGoal(values, tdee)
        : createWeightGoal(values, tdee));
      onClose(); // Close modal on success
      router.invalidate(); // Refresh loader/UI after save
    } catch (error) {
      // Error is handled and displayed by the slice/notification system
      console.error("Save failed in WeightGoalModal:", error);
      // Optionally keep modal open on error, or handle specific errors
    }
  };

  // Use the goal's startingWeight if editing, otherwise use user weight
  const initialStartingWeight = weightGoals?.startingWeight ?? startingWeight;
  const initialTargetWeight =
    weightGoals?.targetWeight ?? targetWeight ?? initialStartingWeight;

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
        startingWeight={initialStartingWeight}
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

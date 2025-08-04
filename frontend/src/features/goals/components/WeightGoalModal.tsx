import { useEffect } from "react";

import Modal from "@/components/ui/Modal";
import {
  useCreateWeightGoal,
  useUpdateWeightGoal,
} from "@/hooks/queries/useGoals";
import type { WeightGoals } from "@/types/goal";

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
  // Use query hooks instead of store
  const createWeightGoalMutation = useCreateWeightGoal();
  const updateWeightGoalMutation = useUpdateWeightGoal();

  useEffect(() => {
    // Modal open effect retained; removed debug log
  }, [isOpen]);

  const handleSave = async (values: WeightGoalFormValues) => {
    try {
      // Use update if we have existing weight goals with a startingWeight (indicating it exists)
      // Otherwise use create
      const hasExistingGoal =
        weightGoals && weightGoals.startingWeight !== undefined;

      await (hasExistingGoal
        ? updateWeightGoalMutation.mutateAsync({ goals: values, tdee })
        : createWeightGoalMutation.mutateAsync({ goals: values, tdee }));

      onClose(); // Close modal on success
    } catch (error) {
      // Error is handled and displayed by the mutation hooks
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
        isLoading={
          createWeightGoalMutation.isPending ||
          updateWeightGoalMutation.isPending
        } // Pass saving state from mutations
        onSave={handleSave} // Pass the correct handler
        onCancel={onClose}
      />
    </Modal>
  );
}

export default WeightGoalModal;

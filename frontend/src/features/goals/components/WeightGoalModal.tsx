import { useState } from "react";

import Modal from "@/components/ui/Modal";
import {
  useCreateWeightGoal,
  useUpdateWeightGoal,
} from "@/hooks/queries/useGoals";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";

import { WeightGoalFormValues } from "../types";
import WeightGoalForm from "./WeightGoalForm";

interface WeightGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  startingWeight: number;
  targetWeight?: number;
  tdee: number;
  weightGoals: WeightGoals | undefined | null;
}

function WeightGoalModal({
  isOpen,
  onClose,
  startingWeight,
  targetWeight,
  tdee,
  weightGoals,
}: WeightGoalModalProps) {
  const createWeightGoalMutation = useCreateWeightGoal();
  const updateWeightGoalMutation = useUpdateWeightGoal();
  const { showNotification } = useStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async (values: WeightGoalFormValues) => {
    setErrorMessage(null);
    
    try {
      const hasExistingGoal =
        weightGoals && weightGoals.startingWeight !== undefined;

      await (hasExistingGoal
        ? updateWeightGoalMutation.mutateAsync({ goals: values, tdee })
        : createWeightGoalMutation.mutateAsync({ goals: values, tdee }));

      // Show success notification
      showNotification(
        hasExistingGoal ? "Weight goal updated successfully!" : "Weight goal created successfully!",
        "success"
      );

      onClose();
    } catch (error: any) {
      const message = error?.message || "Failed to save weight goal. Please try again.";
      setErrorMessage(message);
      console.error("Save failed in WeightGoalModal:", error);
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const initialStartingWeight = weightGoals?.startingWeight ?? startingWeight;
  const initialTargetWeight =
    weightGoals?.targetWeight ?? targetWeight ?? initialStartingWeight;

  const isLoading =
    createWeightGoalMutation.isPending || updateWeightGoalMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={weightGoals ? "Edit Weight Goal" : "Set Weight Goal"}
      variant="form"
      hideDefaultButtons={true}
      size="lg"
    >
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      <WeightGoalForm
        startingWeight={initialStartingWeight}
        targetWeight={initialTargetWeight}
        tdee={tdee}
        weightGoals={weightGoals}
        isLoading={isLoading}
        onSave={handleSave}
        onCancel={handleClose}
      />
    </Modal>
  );
}

export default WeightGoalModal;

import { useRef, useState } from "react";

import Modal from "@/components/ui/Modal";
import {
  useCreateWeightGoal,
  useUpdateWeightGoal,
} from "@/hooks/queries/useGoals";
import { useStore } from "@/store/store";
import type { WeightGoals } from "@/types/goal";

import { WeightGoalFormValues } from "../../types";

import WeightGoalForm, { WeightGoalFormHandle } from "./WeightGoalForm";

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
  const [canSave, setCanSave] = useState(false);
  const formReference = useRef<WeightGoalFormHandle>(null);

  const handleSave = async (values: WeightGoalFormValues) => {
    setErrorMessage(null);

    try {
      const hasExistingGoal =
        weightGoals?.startingWeight !== undefined;

      await (hasExistingGoal
        ? updateWeightGoalMutation.mutateAsync({ goals: values, tdee })
        : createWeightGoalMutation.mutateAsync({ goals: values, tdee }));

      // Show success notification
      showNotification(
        hasExistingGoal
          ? "Weight goal updated successfully!"
          : "Weight goal created successfully!",
        "success",
      );

      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save weight goal. Please try again.";
      setErrorMessage(message);
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const handleModalSave = () => {
    formReference.current?.save();
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
      onSave={handleModalSave}
      saveDisabled={!canSave || isLoading}
      saveLabel={weightGoals ? "Update Goal" : "Set Goal"}
      size="lg"
    >
      {errorMessage && (
        <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
          {errorMessage}
        </div>
      )}
      <WeightGoalForm
        ref={formReference}
        startingWeight={initialStartingWeight}
        targetWeight={initialTargetWeight}
        tdee={tdee}
        weightGoals={weightGoals}
        isLoading={isLoading}
        onSave={handleSave}
        onCanSaveChange={setCanSave}
      />
    </Modal>
  );
}

export default WeightGoalModal;

import { useState, useEffect } from "react";
import { NumberField, CardContainer, FormButton } from "@/components/form";
import { GoalsIcon } from "@/components/Icons";
import { WeightGoalCardProps, WeightGoalFormValues } from "../types";

export default function WeightGoalCard({
  currentWeight,
  targetWeight,
  tdee,
  isLoading = false,
  onSave,
}: WeightGoalCardProps) {
  const [formValues, setFormValues] = useState<WeightGoalFormValues>({
    currentWeight,
    targetWeight: targetWeight || currentWeight,
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setFormValues({
      currentWeight,
      targetWeight: targetWeight || currentWeight,
    });
  }, [currentWeight, targetWeight]);

  useEffect(() => {
    // Check if values have changed from props
    const isDifferent =
      formValues.currentWeight !== currentWeight ||
      formValues.targetWeight !== targetWeight;

    setHasChanges(isDifferent);
  }, [formValues, currentWeight, targetWeight]);

  const handleSave = () => {
    onSave(formValues);
  };

  return (
    <CardContainer>
      <div className="p-5">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-lg bg-indigo-600/20 mr-3">
            <GoalsIcon className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-200">
            Set Your Weight Goal
          </h2>
        </div>

        <div className="space-y-5 mb-5">
          <NumberField
            label="Current Weight (kg)"
            value={formValues.currentWeight}
            onChange={(value) =>
              setFormValues({ ...formValues, currentWeight: value || 0 })
            }
            min={30}
            max={300}
            step={0.1}
            required
            helperText="Your current weight in kilograms"
          />

          <NumberField
            label="Target Weight (kg)"
            value={formValues.targetWeight}
            onChange={(value) =>
              setFormValues({ ...formValues, targetWeight: value || 0 })
            }
            min={30}
            max={300}
            step={0.1}
            required
            helperText="Your goal weight in kilograms"
          />
        </div>

        <div className="flex justify-end">
          <FormButton
            type="button"
            variant="primary"
            disabled={!hasChanges || isLoading}
            isLoading={isLoading}
            onClick={handleSave}
          >
            Calculate Goal
          </FormButton>
        </div>
      </div>
    </CardContainer>
  );
}

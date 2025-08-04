import { memo, useCallback, useEffect, useState } from "react";

import { ProFeature } from "@/components/billing";
import { CardContainer, InfoCard, LoadingSpinner } from "@/components/form";
import MacroTarget from "@/components/macros/MacroTarget";
import { Button, CheckMarkIcon, InfoIcon } from "@/components/ui";
import { useUpdateMacroTarget } from "@/hooks/queries";
import type { MacroTargetSettings, MacroTargetState } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";

interface MacroTargetFormProps {
  macroTarget: MacroTargetSettings | null;
}

function MacroTargetForm({ macroTarget }: MacroTargetFormProps) {
  const { mutateAsync, isPending } = useUpdateMacroTarget();
  // Local state for edited values
  const [localTarget, setLocalTarget] = useState<
    MacroTargetState | undefined
  >();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Helper function to convert MacroTargetSettings to MacroTargetState
  const toMacroTargetState = (
    settings: MacroTargetSettings,
  ): MacroTargetState => ({
    proteinPercentage: settings.proteinPercentage,
    carbsPercentage: settings.carbsPercentage,
    fatsPercentage: settings.fatsPercentage,
    lockedMacros: settings.lockedMacros || [],
  });

  // Initialize local target from prop value
  useEffect(() => {
    if (macroTarget) {
      setLocalTarget(toMacroTargetState(macroTarget));
      setHasChanges(false);
    }
  }, [macroTarget]);

  // Handle local changes from the slider component
  const handleMacroTargetChange = useCallback(
    (target: MacroTargetState) => {
      setLocalTarget(target);

      if (macroTarget) {
        const hasChanges =
          target.proteinPercentage !== macroTarget.proteinPercentage ||
          target.carbsPercentage !== macroTarget.carbsPercentage ||
          target.fatsPercentage !== macroTarget.fatsPercentage ||
          // Check for differences in lockedMacros arrays
          JSON.stringify(target.lockedMacros || []) !==
            JSON.stringify(macroTarget.lockedMacros || []);

        setHasChanges(hasChanges);
      } else {
        setHasChanges(true);
      }

      // Clear success message when changes are made
      if (saveSuccess) {
        setSaveSuccess(false);
      }
    },
    [macroTarget, saveSuccess],
  );

  // Save changes to the backend
  const handleSaveChanges = useCallback(() => {
    if (localTarget && hasChanges) {
      // Convert MacroTargetState back to MacroTargetSettings for the API
      const settingsToSave: MacroTargetSettings = {
        proteinPercentage: localTarget.proteinPercentage,
        carbsPercentage: localTarget.carbsPercentage,
        fatsPercentage: localTarget.fatsPercentage,
        lockedMacros:
          localTarget.lockedMacros.length > 0
            ? localTarget.lockedMacros
            : undefined,
      };

      mutateAsync(settingsToSave)
        .then(() => {
          setSaveSuccess(true);
          setHasChanges(false);
          // Clear success message after 3 seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        })
        .catch(() => {
          // Error handling is done in the mutation
        });
    }
  }, [localTarget, hasChanges, mutateAsync]);

  // Reset to original values
  const handleReset = useCallback(() => {
    if (macroTarget) {
      setLocalTarget(toMacroTargetState(macroTarget));
    } else {
      setLocalTarget(DEFAULT_MACRO_TARGET);
    }
    setHasChanges(false);
    setSaveSuccess(false);
  }, [macroTarget]);

  // Only use displayValues when we actually have a localTarget
  // This ensures we don't render the form with default values while loading
  const hasValidValues = localTarget !== undefined;

  // Use local target values for rendering
  const displayValues = localTarget || DEFAULT_MACRO_TARGET;

  return (
    <ProFeature>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
        {/* Left side - Main content (4 cols) */}
        <div className="flex h-full flex-col lg:col-span-4">
          <CardContainer className="h-full p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Macro Target Settings
              </h3>
              <div className="rounded-full border border-primary/30 bg-primary/20 px-3 py-1">
                <span className="text-sm text-foreground">Daily Target</span>
              </div>
            </div>

            <p className="mb-6 text-sm text-foreground">
              Adjust the sliders below to set your preferred macronutrient
              target. These percentages will be used to calculate your daily
              macro target based on your calorie needs.
            </p>

            {/* Show skeleton loader when loading or when we don't have valid values yet */}
            {hasValidValues ? (
              <MacroTarget
                initialValues={displayValues}
                onTargetChange={handleMacroTargetChange}
              />
            ) : (
              <div className="space-y-10">
                {/* Skeleton for the stacked bar */}
                <div className="relative mb-6 h-2 animate-pulse overflow-hidden rounded-full bg-surface" />

                {/* Skeleton for sliders */}
                <div className="space-y-8">
                  {/* Protein slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>

                  {/* Carbs slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>

                  {/* Fats slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>
                </div>

                {/* Skeleton for badges */}
                <div className="grid grid-cols-3 gap-2 pt-5">
                  <div className="h-10 animate-pulse rounded bg-surface" />
                  <div className="h-10 animate-pulse rounded bg-surface" />
                  <div className="h-10 animate-pulse rounded bg-surface" />
                </div>
              </div>
            )}

            {/* Save/Reset Controls */}
            <div className="mt-8 flex items-center justify-between">
              {isPending ? (
                <div className="flex items-center text-sm text-foreground">
                  <LoadingSpinner size="sm" color="text-foreground" />
                  <span className="ml-2">Loading your saved targets...</span>
                </div>
              ) : (
                <>
                  {saveSuccess && (
                    <div className="flex items-center text-sm text-success">
                      <CheckMarkIcon className="mr-1 h-4 w-4" />
                      Settings saved successfully
                    </div>
                  )}
                  {!saveSuccess && hasChanges && (
                    <div className="text-sm text-warning">
                      You have unsaved changes
                    </div>
                  )}
                  {!saveSuccess && !hasChanges && <div />}
                </>
              )}
              <div className="flex gap-4">
                {hasChanges && (
                  <Button
                    type="button"
                    onClick={handleReset}
                    buttonSize="lg"
                    variant="ghost"
                    disabled={isPending}
                    text="Reset"
                    ariaLabel="Reset macro targets"
                    className="px-4 py-2 text-sm text-foreground transition-colors hover:text-foreground"
                  />
                )}
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  autoLoadingFeature="goals"
                  loadingText="Saving..."
                  disabled={!hasChanges}
                  text="Save Targets"
                  buttonSize="lg"
                  variant="primary"
                  ariaLabel="Save macro targets"
                  className="px-4 py-2 text-sm"
                />
              </div>
            </div>
          </CardContainer>
        </div>

        {/* Right side - Info panel (2 cols) */}
        <div className="flex h-full flex-col lg:col-span-2">
          <CardContainer className="h-full p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">
              Understanding Macros
            </h3>
            <div className="flex-1 space-y-4">
              <InfoCard
                title="Protein"
                description="Essential for muscle repair and growth."
                color="protein"
              />

              <InfoCard
                title="Carbohydrates"
                description="Your body's primary energy source."
                color="carbs"
              />

              <InfoCard
                title="Fats"
                description="Essential for hormone production and nutrient absorption."
                color="fats"
              />

              <InfoCard
                title="Tips"
                color="indigo"
                icon={<InfoIcon className="h-4 w-4 text-vibrant-accent" />}
              >
                <ul className="mt-2 space-y-2 text-sm text-foreground">
                  <li>• For muscle growth keep protein between 20-35% </li>
                  <li>• Carbs work best at 45-65%</li>
                  <li>• Fats should stay between 20-35%</li>
                </ul>
              </InfoCard>
            </div>
          </CardContainer>
        </div>
      </div>
    </ProFeature>
  );
}

export default memo(MacroTargetForm);

import { memo, useCallback, useState, useEffect } from "react";
import { MacroTargetSettings, MacroTarget } from "@/types/macro";
import type { MacroTargetState } from "@/types/macro";
import { InfoCard, CardContainer, FormButton } from "@/components/form";
import { InfoIcon, CheckMarkIcon, LoadingSpinner } from "@/components/ui";
import { useStore } from "@/store/store";

import { ProFeature } from "@/components/billing/ProFeature";

// Default macro values (30/40/30 split)
const DEFAULT_MACRO_TARGET: MacroTargetState = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};

function MacroTargetForm() {
  const {
    macroTarget,
    updateMacroTargetSettings,
    isTargetSaving,
    isTargetLoading,
    fetchMacroTarget,
  } = useStore();

  // Local state for edited values
  const [localTarget, setLocalTarget] = useState<MacroTargetState | null>(null);
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

  // Initialize local target from store values
  useEffect(() => {
    if (macroTarget) {
      setLocalTarget(toMacroTargetState(macroTarget));
      setHasChanges(false);
    }
  }, [macroTarget]);

  // Fetch macro target on component mount if not already available
  useEffect(() => {
    if (!macroTarget && !isTargetLoading) {
      fetchMacroTarget();
    }
  }, [macroTarget, isTargetLoading, fetchMacroTarget]);

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

      updateMacroTargetSettings(settingsToSave)
        .then(() => {
          setSaveSuccess(true);
          setHasChanges(false);
          // Clear success message after 3 seconds
          setTimeout(() => setSaveSuccess(false), 3000);
        })
        .catch(() => {
          // Error handling is done in the store
        });
    }
  }, [localTarget, hasChanges, updateMacroTargetSettings]);

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
  const hasValidValues = localTarget !== null;

  // Use local target values for rendering
  const displayValues = localTarget || DEFAULT_MACRO_TARGET;

  return (
    <ProFeature>
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
        {/* Left side - Main content (4 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <CardContainer className="p-6 h-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-200">
                Macro Target Settings
              </h3>
              <div className="px-3 py-1 bg-indigo-600/20 border border-indigo-500/30 rounded-full">
                <span className="text-sm text-indigo-300">Daily Target</span>
              </div>
            </div>

            <p className="text-gray-400 text-sm mb-6">
              Adjust the sliders below to set your preferred macronutrient
              target. These percentages will be used to calculate your daily
              macro target based on your calorie needs.
            </p>

            {/* Show skeleton loader when loading or when we don't have valid values yet */}
            {isTargetLoading || !hasValidValues ? (
              <div className="space-y-10">
                {/* Skeleton for the stacked bar */}
                <div className="relative h-2 mb-6 rounded-full overflow-hidden bg-gray-700/30 animate-pulse" />

                {/* Skeleton for sliders */}
                <div className="space-y-8">
                  {/* Protein slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full animate-pulse" />
                  </div>

                  {/* Carbs slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full animate-pulse" />
                  </div>

                  {/* Fats slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 bg-gray-700/50 rounded animate-pulse" />
                      <div className="h-4 w-12 bg-gray-700/50 rounded animate-pulse" />
                    </div>
                    <div className="h-2 bg-gray-700/50 rounded-full animate-pulse" />
                  </div>
                </div>

                {/* Skeleton for badges */}
                <div className="grid grid-cols-3 gap-2 pt-5">
                  <div className="h-10 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-10 bg-gray-700/50 rounded animate-pulse" />
                  <div className="h-10 bg-gray-700/50 rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <MacroTarget
                initialValues={displayValues}
                onTargetChange={handleMacroTargetChange}
              />
            )}

            {/* Save/Reset Controls */}
            <div className="flex justify-between items-center mt-8">
              {isTargetLoading ? (
                <div className="text-gray-400 text-sm flex items-center">
                  <LoadingSpinner size="sm" color="text-gray-400" />
                  <span className="ml-2">Loading your saved targets...</span>
                </div>
              ) : (
                <>
                  {saveSuccess && (
                    <div className="text-green-400 text-sm flex items-center">
                      <CheckMarkIcon className="w-4 h-4 mr-1" />
                      Settings saved successfully
                    </div>
                  )}
                  {!saveSuccess && hasChanges && (
                    <div className="text-yellow-400 text-sm">
                      You have unsaved changes
                    </div>
                  )}
                  {!saveSuccess && !hasChanges && <div />}
                </>
              )}
              <div className="flex gap-4">
                {hasChanges && (
                  <FormButton
                    type="button"
                    onClick={handleReset}
                    disabled={isTargetLoading || isTargetSaving}
                    variant="ghost"
                    text="Reset"
                  />
                )}
                <FormButton
                  type="button"
                  onClick={handleSaveChanges}
                  isLoading={isTargetSaving}
                  disabled={!hasChanges || isTargetLoading}
                  text="Save Targets"
                  buttonSize="lg"
                  variant="primary"
                  className="px-8 py-3 text-lg"
                />
              </div>
            </div>
          </CardContainer>
        </div>

        {/* Right side - Info panel (2 cols) */}
        <div className="lg:col-span-2 flex flex-col h-full">
          <CardContainer className="p-6 h-full">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              Understanding Macros
            </h3>
            <div className="space-y-4 flex-1">
              <InfoCard
                title="Protein"
                description="Essential for muscle repair and growth."
                color="green"
              />

              <InfoCard
                title="Carbohydrates"
                description="Your body's primary energy source."
                color="blue"
              />

              <InfoCard
                title="Fats"
                description="Essential for hormone production and nutrient absorption."
                color="red"
              />

              <InfoCard
                title="Tips"
                color="indigo"
                icon={<InfoIcon className="w-4 h-4 text-indigo-400" />}
              >
                <ul className="text-sm text-gray-400 space-y-2 mt-2">
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

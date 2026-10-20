import { memo, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import CardContainer from "@/components/form/CardContainer";
import MacroTarget from "@/components/macros/MacroTarget";
import { Button, CheckIcon } from "@/components/ui";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useUpdateMacroTarget } from "@/hooks/queries";
import type { MacroTargetSettings, MacroTargetState } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";
import { handleApiError } from "@/utils/errorHandling";

const MACRO_NOTES = [
  {
    name: "Protein",
    dot: "bg-protein",
    text: "Repairs and builds muscle. For muscle growth keep it between 20 and 35%.",
  },
  {
    name: "Carbs",
    dot: "bg-carbs",
    text: "Your main source of energy. Most people do well at 45 to 65%.",
  },
  {
    name: "Fats",
    dot: "bg-fats",
    text: "Needed for hormones and for absorbing vitamins. Keep it between 20 and 35%.",
  },
];

interface MacroTargetFormProps {
  macroTarget: MacroTargetSettings | null;
}

const validateTarget = ({ value }: { value: { target: MacroTargetState } }) => {
  const { proteinPercentage, carbsPercentage, fatsPercentage } = value.target;

  return proteinPercentage + carbsPercentage + fatsPercentage === 100
    ? undefined
    : "Macro percentages must add up to 100%";
};

const toMacroTargetState = (
  settings: MacroTargetSettings,
): MacroTargetState => ({
  proteinPercentage: settings.proteinPercentage,
  carbsPercentage: settings.carbsPercentage,
  fatsPercentage: settings.fatsPercentage,
  lockedMacros: settings.lockedMacros ?? [],
});

function MacroTargetForm({ macroTarget }: MacroTargetFormProps) {
  const { mutateAsync, isPending } = useUpdateMacroTarget();
  const [saveSuccess, setSaveSuccess] = useState(false);
  // The sliders keep their own state, so a reset remounts them.
  const [resetCount, setResetCount] = useState(0);

  const form = useForm({
    defaultValues: {
      target: macroTarget
        ? toMacroTargetState(macroTarget)
        : DEFAULT_MACRO_TARGET,
    },
    validators: { onSubmit: validateTarget },
    onSubmit: async ({ value, formApi }) => {
      const { target } = value;
      try {
        await mutateAsync({
          proteinPercentage: target.proteinPercentage,
          carbsPercentage: target.carbsPercentage,
          fatsPercentage: target.fatsPercentage,
          lockedMacros:
            target.lockedMacros.length > 0 ? target.lockedMacros : undefined,
        });
        formApi.reset(value);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        handleApiError(error, "save macro target settings");
      }
    },
  });
  const hasChanges = !useStore(form.store, (state) => state.isDefaultValue);
  const submitError = useStore(form.store, (state) => state.errorMap.onSubmit);

  const handleReset = () => {
    form.reset();
    setResetCount((count) => count + 1);
    setSaveSuccess(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-6">
      {/* Left side - Main content (4 cols) */}
      <div className="flex h-full flex-col lg:col-span-4">
        <CardContainer className="h-full p-3.5 sm:p-6 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0">
          <div className="mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground/90">
              Macro target settings
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted">
              Drag a slider to change your split. Lock one to hold it while you move the others.
            </p>
          </div>

          {/* Show skeleton loader when loading or when we don't have valid values yet */}
          <div className="rounded-card border border-border bg-surface-2 p-5 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0">
            {macroTarget ? (
              <form.Field name="target">
                {(field) => (
                  <MacroTarget
                    key={resetCount}
                    initialValues={field.state.value}
                    onTargetChange={(target) => {
                      field.handleChange(target);
                      setSaveSuccess(false);
                    }}
                  />
                )}
              </form.Field>
            ) : (
              <div className="space-y-10">
                {/* Skeleton for the stacked bar */}
                <div className="relative mb-6 h-2 animate-pulse overflow-hidden rounded-full bg-surface" />

                {/* Skeleton for sliders */}
                <div className="space-y-8">
                  {/* Protein slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded-control bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded-control bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>

                  {/* Carbs slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded-control bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded-control bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>

                  {/* Fats slider skeleton */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-20 animate-pulse rounded-control bg-surface" />
                      <div className="h-4 w-12 animate-pulse rounded-control bg-surface" />
                    </div>
                    <div className="h-2 animate-pulse rounded-full bg-surface" />
                  </div>
                </div>

                {/* Skeleton for badges */}
                <div className="grid grid-cols-3 gap-2 pt-5">
                  <div className="h-10 animate-pulse rounded-control bg-surface" />
                  <div className="h-10 animate-pulse rounded-control bg-surface" />
                  <div className="h-10 animate-pulse rounded-control bg-surface" />
                </div>
              </div>
            )}
          </div>

          {/* Save/Reset Controls */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
            {isPending ? (
              <div className="flex items-center text-sm text-foreground">
                <LoadingSpinner size="sm" color="text-foreground" />
                <span className="ml-2">Loading your saved targets...</span>
              </div>
            ) : (
              <>
                {saveSuccess && (
                  <div className="flex items-center text-sm text-success">
                    <CheckIcon className="mr-1 h-4 w-4" />
                    Settings saved successfully
                  </div>
                )}
                {!saveSuccess && submitError && (
                  <div role="alert" className="text-sm text-error">
                    {submitError}
                  </div>
                )}
                {!saveSuccess && !submitError && hasChanges && (
                  <div className="text-sm text-warning">
                    You have unsaved changes
                  </div>
                )}
                {!saveSuccess && !submitError && !hasChanges && <div />}
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
                onClick={() => void form.handleSubmit()}
                isLoading={isPending}
                loadingText="Saving..."
                disabled={!hasChanges}
                text="Save targets"
                buttonSize="lg"
                variant="primary"
                ariaLabel="Save macro targets"
                className="px-4 py-2 text-sm"
              />
            </div>
          </div>
        </CardContainer>
      </div>

      {/* Right side - what each macro is for, and the range most people land in */}
      <div className="flex h-full flex-col lg:col-span-2">
        <CardContainer className="h-full bg-surface-2 p-3.5 sm:p-6 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:p-0">
          <h3 className="mb-4 text-base font-semibold tracking-tight text-foreground">
            Understanding macros
          </h3>
          <dl className="space-y-4">
            {MACRO_NOTES.map((note) => (
              <div key={note.name}>
                <dt className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className={`h-2 w-2 rounded-full ${note.dot}`} />
                  {note.name}
                </dt>
                <dd className="mt-1 text-sm text-muted">{note.text}</dd>
              </div>
            ))}
          </dl>
        </CardContainer>
      </div>
    </div>
  );
}

export default memo(MacroTargetForm);

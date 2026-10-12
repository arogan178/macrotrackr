import { useState } from "react";
import { format } from "date-fns";

import NumberField from "@/components/form/NumberField";
import { Button, Modal } from "@/components/ui";
import { usePartialDays, useSetPartialDay } from "@/hooks/queries/useMacroQueries";
import { formatGrouped } from "@/lib/formatNumber";
import { useStore } from "@/store/store";
import type { MacroTargetSettings } from "@/types/macro";
import { DEFAULT_MACRO_TARGET } from "@/utils/constants/macro";
import { calculateMacroTarget } from "@/utils/nutritionCalculations";

import type { MacroEntryInput } from "../types/macro";

interface PartialDayControlsProps {
  date: string;
  macroTarget?: MacroTargetSettings;
  onEstimate: (entry: MacroEntryInput) => Promise<void>;
}

/** Split a calorie figure into grams by the user's macro target percentages. */
export function estimateGrams(calories: number, target: MacroTargetSettings) {
  const { proteinTarget, carbsTarget, fatsTarget } = calculateMacroTarget(
    calories,
    target.proteinPercentage,
    target.carbsPercentage,
    target.fatsPercentage,
  );

  return { protein: proteinTarget, carbs: carbsTarget, fats: fatsTarget };
}

export default function PartialDayControls({
  date,
  macroTarget,
  onEstimate,
}: PartialDayControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = usePartialDays(date, date);
  const setPartialDay = useSetPartialDay();
  const showNotification = useStore((state) => state.showNotification);
  // Local so the box flips on click; it also holds while a write waits offline.
  const [pending, setPending] = useState<{ date: string; partial: boolean }>();
  const isPartial =
    pending?.date === date
      ? pending.partial
      : (data?.dates.includes(date) ?? false);

  const togglePartial = (partial: boolean) => {
    setPending({ date, partial });
    setPartialDay.mutate(
      { date, partial },
      {
        onError: () =>
          showNotification("Could not update this day. Try again.", "error"),
        onSettled: () => setPending(undefined),
      },
    );
  };

  return (
    <>
      <Button
        variant={isPartial ? "secondary" : "ghost"}
        buttonSize="sm"
        // Keeps the 44px touch target without growing the 36px header row.
        className="-my-1"
        text={isPartial ? "Partly logged" : "Missed something?"}
        onClick={() => setIsOpen(true)}
      />
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Missed something?"
        variant="form"
        size="sm"
      >
        {isOpen && (
          <div className="space-y-5">
            <EstimateForm
              date={date}
              target={macroTarget ?? DEFAULT_MACRO_TARGET}
              onEstimate={onEstimate}
              onClose={() => setIsOpen(false)}
            />
            <div className="space-y-1 border-t border-border pt-4">
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={isPartial}
                  onChange={(event) => togglePartial(event.target.checked)}
                  className="h-4 w-4 rounded-control border-border accent-primary"
                  aria-describedby="partial-day-hint"
                />
                Partly logged
              </label>
              <p id="partial-day-hint" className="text-xs text-muted">
                Or leave this day out of trend estimates instead.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

function EstimateForm({
  date,
  target,
  onEstimate,
  onClose,
}: {
  date: string;
  target: MacroTargetSettings;
  onEstimate: (entry: MacroEntryInput) => Promise<void>;
  onClose: () => void;
}) {
  const [calories, setCalories] = useState<number>();
  const [isSaving, setIsSaving] = useState(false);
  const isValid = calories !== undefined && calories > 0;
  const grams = estimateGrams(calories ?? 0, target);

  const submit = async () => {
    if (!isValid) return;
    setIsSaving(true);
    try {
      // The normal create path, so it queues offline like any other entry.
      await onEstimate({
        ...grams,
        mealType: "snack",
        mealName: "Estimate",
        entryDate: date,
        entryTime: format(new Date(), "HH:mm"),
      });
      onClose();
    } catch {
      // onEstimate has already shown the error; keep the value for a retry.
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <NumberField
        id="estimate-calories"
        label="Calories not logged"
        value={calories}
        onChange={setCalories}
        min={1}
        maxDigits={4}
        unit="kcal"
        placeholder={500}
        required
      />
      <p className="text-sm text-muted" aria-live="polite">
        {isValid
          ? `Adds ${formatGrouped(grams.protein)} g protein, ${formatGrouped(grams.carbs)} g carbs, ${formatGrouped(grams.fats)} g fats as a snack named Estimate.`
          : "Split by your macro targets and logged as a snack named Estimate."}
      </p>
      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          text="Add estimate"
          disabled={!isValid || isSaving}
        />
      </div>
    </form>
  );
}

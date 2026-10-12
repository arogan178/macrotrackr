import { useState } from "react";
import { parseISO } from "date-fns";

import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import { Button, Modal } from "@/components/ui";
import type { MacroEntry, MealType } from "@/types/macro";
import { getDisplayDate, isValidDateString } from "@/utils/dateUtilities";

import { MEAL_TYPE_OPTIONS } from "../constants";

export interface EntryDestination {
  entryDate: string;
  mealType: MealType;
}

interface CopyMoveEntryModalProps {
  entry: MacroEntry | undefined;
  today: string;
  /** The free plan's oldest visible day; nothing may land before it. */
  oldestDate?: string;
  onCopy: (entry: MacroEntry, destination: EntryDestination) => void;
  onMove: (entry: MacroEntry, destination: EntryDestination) => void;
  onClose: () => void;
}

export default function CopyMoveEntryModal({
  entry,
  today,
  oldestDate,
  onCopy,
  onMove,
  onClose,
}: CopyMoveEntryModalProps) {
  return (
    <Modal
      isOpen={entry !== undefined}
      onClose={onClose}
      title="Copy or move entry"
      variant="form"
      size="sm"
    >
      {entry && (
        // Keyed so each entry opens on fresh defaults.
        <CopyMoveEntryForm
          key={entry.clientId}
          entry={entry}
          today={today}
          oldestDate={oldestDate}
          onCopy={onCopy}
          onMove={onMove}
          onClose={onClose}
        />
      )}
    </Modal>
  );
}

function CopyMoveEntryForm({
  entry,
  today,
  oldestDate,
  onCopy,
  onMove,
  onClose,
}: CopyMoveEntryModalProps & { entry: MacroEntry }) {
  const [entryDate, setEntryDate] = useState(today);
  const [mealType, setMealType] = useState<MealType>(entry.mealType);

  // The native picker enforces min and max, but a typed date gets past it.
  const isDateAllowed =
    isValidDateString(entryDate) &&
    entryDate <= today &&
    (!oldestDate || entryDate >= oldestDate);
  const isUnchanged =
    entryDate === entry.entryDate && mealType === entry.mealType;
  const destination = { entryDate, mealType };
  const dateHint = oldestDate
    ? `Pick a date from ${getDisplayDate(parseISO(oldestDate))} to today`
    : "Pick a date up to today";

  const copy = () => {
    if (!isDateAllowed) return;
    onCopy(entry, destination);
    onClose();
  };

  const move = () => {
    if (!isDateAllowed || isUnchanged) return;
    onMove(entry, destination);
    onClose();
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        copy();
      }}
    >
      <p className="truncate text-sm text-muted">
        {entry.foodName ?? entry.mealName}
      </p>
      <div className="grid grid-cols-2 gap-3">
        <DateField
          id="copy-move-date"
          label="Date"
          value={entryDate}
          onChange={setEntryDate}
          minDate={oldestDate}
          maxDate={today}
          error={isDateAllowed ? undefined : dateHint}
          required
        />
        <Dropdown
          id="copy-move-meal-type"
          label="Meal type"
          value={mealType}
          onChange={(value) => setMealType(value as MealType)}
          options={MEAL_TYPE_OPTIONS.map((option) => ({
            value: option.value,
            label: option.display,
          }))}
        />
      </div>
      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          text="Move"
          onClick={move}
          disabled={!isDateAllowed || isUnchanged}
        />
        <Button
          type="submit"
          variant="primary"
          text="Copy"
          disabled={!isDateAllowed}
        />
      </div>
    </form>
  );
}

import { useEffect, useState } from "react";

import { NumberField, TextField } from "@/components/form";
import Modal from "@/components/ui/Modal";
import { MacroEntry } from "@/types/macro";

interface EditModalProps {
  entry: MacroEntry | undefined;
  onSave: (entry: MacroEntry) => void;
  onClose: () => void;
  isSaving: boolean;
  isOpen: boolean;
}

export default function EditModal({
  entry,
  onSave,
  onClose,
  isSaving,
  isOpen,
}: EditModalProps) {
  const [editedEntry, setEditedEntry] = useState<MacroEntry | null>(null);
  const [formValid, setFormValid] = useState(true);

  // Update editedEntry when entry prop changes (to handle fresh data from cache)
  useEffect(() => {
    if (entry) {
      setEditedEntry({ ...entry });
    }
  }, [entry]);

  // Validate form whenever entry changes
  useEffect(() => {
    if (editedEntry) {
      const isValid =
        editedEntry.mealName.trim() !== "" &&
        editedEntry.protein >= 0 &&
        editedEntry.carbs >= 0 &&
        editedEntry.fats >= 0;

      setFormValid(isValid);
    }
  }, [editedEntry]);

  const handleInputChange = (field: keyof MacroEntry, value: string) => {
    setEditedEntry((previous) =>
      previous
        ? {
            ...previous,
            [field]: field === "mealName" ? value : Number(value) || 0,
          }
        : null,
    );
  };

  const handleNumberChange = (
    field: keyof MacroEntry,
    value: number | undefined,
  ) => {
    setEditedEntry((previous) =>
      previous
        ? {
            ...previous,
            [field]: value ?? 0,
          }
        : null,
    );
  };

  const handleSave = () => {
    if (!formValid || !editedEntry) return;
    onSave(editedEntry);
  };

  // Don't render if no entry data
  if (!editedEntry) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Nutrition Entry"
      variant="form"
      onSave={handleSave}
      saveDisabled={!formValid || isSaving}
      size="md"
    >
      <div className="space-y-4">
        <TextField
          label="Food Name"
          value={String(editedEntry.mealName)}
          onChange={(value) => handleInputChange("mealName", value)}
          placeholder="Enter food name"
          required
        />
        <div className="grid grid-cols-3 gap-4">
          <NumberField
            label="Protein (g)"
            value={editedEntry.protein}
            onChange={(value: number | undefined) =>
              handleNumberChange("protein", value)
            }
            min={0}
            step={0.1}
          />
          <NumberField
            label="Carbs (g)"
            value={editedEntry.carbs}
            onChange={(value: number | undefined) =>
              handleNumberChange("carbs", value)
            }
            min={0}
            step={0.1}
          />
          <NumberField
            label="Fats (g)"
            value={editedEntry.fats}
            onChange={(value: number | undefined) =>
              handleNumberChange("fats", value)
            }
            min={0}
            step={0.1}
          />
        </div>

        <div className="mt-2 text-sm">
          <div className="flex justify-between text-foreground">
            <span>Total Calories:</span>
            <span className="font-medium text-foreground">
              {Math.round(
                editedEntry.protein * 4 +
                  editedEntry.carbs * 4 +
                  editedEntry.fats * 9,
              )}
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

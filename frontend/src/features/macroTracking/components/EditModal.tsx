import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

import { NumberField, TextField } from "@/components/form";
import Modal from "@/components/ui/Modal";
import { Ingredient, MacroEntry } from "@/types/macro";

interface EditModalProps {
  entry: MacroEntry | undefined;
  onSave: (entry: MacroEntry) => void;
  onClose: () => void;
  isSaving: boolean;
  isOpen: boolean;
}

// Calculate totals from ingredients outside component
const calculateTotalsFromIngredients = (ingredients: Ingredient[]) => {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;
  
  for (const ingredient of ingredients) {
    totalProtein += ingredient.protein || 0;
    totalCarbs += ingredient.carbs || 0;
    totalFats += ingredient.fats || 0;
  }
  
  return { protein: totalProtein, carbs: totalCarbs, fats: totalFats };
};

export default function EditModal({
  entry,
  onSave,
  onClose,
  isSaving,
  isOpen,
}: EditModalProps) {
  const [editedEntry, setEditedEntry] = useState<MacroEntry | null>(null);
  const [formValid, setFormValid] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);

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

  // Ingredient management functions
  const addIngredient = () => {
    if (!editedEntry) return;
    const newIngredient: Ingredient = {
      name: "",
      protein: 0,
      carbs: 0,
      fats: 0,
    };
    const updatedIngredients = [
      ...(editedEntry.ingredients || []),
      newIngredient,
    ];
    const totals = calculateTotalsFromIngredients(updatedIngredients);
    setEditedEntry({
      ...editedEntry,
      ingredients: updatedIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  const removeIngredient = (index: number) => {
    if (!editedEntry) return;
    const updatedIngredients = editedEntry.ingredients?.filter((_, index_) => index_ !== index) || [];
    const totals = calculateTotalsFromIngredients(updatedIngredients);
    setEditedEntry({
      ...editedEntry,
      ingredients: updatedIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string | number | undefined
  ) => {
    if (!editedEntry) return;
    const updatedIngredients = editedEntry.ingredients?.map((ing, index_) =>
      index_ === index
        ? { ...ing, [field]: field === "name" || field === "unit" ? value : Number(value) || 0 }
        : ing
    ) || [];
    const totals = calculateTotalsFromIngredients(updatedIngredients);
    setEditedEntry({
      ...editedEntry,
      ingredients: updatedIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  const hasIngredients = editedEntry?.ingredients && editedEntry.ingredients.length > 0;

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

        {/* Ingredients Section */}
        <div className="mt-6 border-t border-border/40 pt-4">
          <button
            type="button"
            onClick={() => setShowIngredients(!showIngredients)}
            className="flex w-full items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80"
          >
            <span>Ingredients</span>
            <motion.div
              animate={{ rotate: showIngredients ? -180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {showIngredients && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-3">
                  {hasIngredients ? (
                    <div className="max-h-[280px] space-y-2 overflow-y-auto overscroll-contain pr-1">
                      {editedEntry.ingredients?.map((ingredient, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.15, delay: index * 0.03 }}
                          className="rounded-md border border-border/30 bg-surface-2/30 p-2"
                        >
                          {/* Compact header with name and remove button */}
                          <div className="mb-1.5 flex items-center gap-2">
                            <input
                              type="text"
                              value={ingredient.name}
                              onChange={(event_) =>
                                updateIngredient(index, "name", event_.target.value)
                              }
                              placeholder="Ingredient name"
                              className="min-w-0 flex-1 border-0 border-b border-border/30 bg-transparent px-2 py-1 text-sm placeholder:text-muted focus:border-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="hover:text-destructive shrink-0 p-1 text-muted transition-colors"
                              title="Remove ingredient"
                              aria-label="Remove ingredient"
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          {/* Compact macro row */}
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={ingredient.protein || ""}
                                onChange={(event_) =>
                                  updateIngredient(index, "protein", event_.target.value === "" ? 0 : Number(event_.target.value))
                                }
                                placeholder="P"
                                min={0}
                                step={0.1}
                                className="w-full rounded bg-protein/10 px-1.5 py-0.5 text-center text-xs text-protein placeholder:text-protein/50 focus:ring-1 focus:ring-protein/30 focus:outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                value={ingredient.carbs || ""}
                                onChange={(event_) =>
                                  updateIngredient(index, "carbs", event_.target.value === "" ? 0 : Number(event_.target.value))
                                }
                                placeholder="C"
                                min={0}
                                step={0.1}
                                className="w-full rounded bg-carbs/10 px-1.5 py-0.5 text-center text-xs text-carbs placeholder:text-carbs/50 focus:ring-1 focus:ring-carbs/30 focus:outline-none"
                              />
                            </div>
                            <div className="flex-1">
                              <input
                                type="number"
                                value={ingredient.fats || ""}
                                onChange={(event_) =>
                                  updateIngredient(index, "fats", event_.target.value === "" ? 0 : Number(event_.target.value))
                                }
                                placeholder="F"
                                min={0}
                                step={0.1}
                                className="w-full rounded bg-fats/10 px-1.5 py-0.5 text-center text-xs text-fats placeholder:text-fats/50 focus:ring-1 focus:ring-fats/30 focus:outline-none"
                              />
                            </div>
                            <div className="w-12">
                              <input
                                type="number"
                                value={ingredient.quantity || ""}
                                onChange={(event_) =>
                                  updateIngredient(index, "quantity", event_.target.value === "" ? undefined : Number(event_.target.value))
                                }
                                placeholder="Qty"
                                min={0}
                                step={0.1}
                                className="w-full rounded bg-surface-3 px-1 py-0.5 text-center text-xs placeholder:text-muted focus:ring-1 focus:ring-primary/30 focus:outline-none"
                              />
                            </div>
                            <div className="w-10">
                              <input
                                type="text"
                                value={ingredient.unit || ""}
                                onChange={(event_) =>
                                  updateIngredient(index, "unit", event_.target.value)
                                }
                                placeholder="g"
                                className="w-full rounded bg-surface-3 px-1 py-0.5 text-center text-xs placeholder:text-muted focus:ring-1 focus:ring-primary/30 focus:outline-none"
                              />
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-sm text-muted">
                      No ingredients added yet
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={addIngredient}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border/50 bg-surface-2/20 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border hover:bg-surface-2/40 hover:text-foreground"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add Ingredient
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Modal>
  );
}

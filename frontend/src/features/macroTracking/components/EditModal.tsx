import { useEffect, useMemo, useState } from "react";

import Modal from "@/components/ui/Modal";
import IngredientsPanel from "@/features/macroTracking/components/edit-modal/IngredientsPanel";
import MealDetailsSection from "@/features/macroTracking/components/edit-modal/MealDetailsSection";
import { UnitConverter, type UnitType } from "@/features/macroTracking/utils/units";
import { useBeforeUnload } from "@/hooks";
import { handleApiError } from "@/utils/errorHandling";
import { Ingredient, MacroEntry } from "@/types/macro";

interface EditModalProps {
  entry: MacroEntry | undefined;
  onSave: (entry: MacroEntry) => void | Promise<void>;
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

const roundValue = (value: number) => Number(value.toFixed(1));

// Normalize quantity to comparable value (weight in grams, volume in ml, or unit)
const normalizeQuantity = (quantity: number, unit: string): { value: number; type: 'weight' | 'volume' | 'unit' } => {
  const normalizedUnit = unit === "l" ? "L" : unit;
  const unitType = normalizedUnit as UnitType;

  if (UnitConverter.isWeightUnit(unitType)) {
    return { value: UnitConverter.convert(quantity, unitType, "g"), type: 'weight' };
  }
  if (UnitConverter.isVolumeUnit(unitType)) {
    return { value: UnitConverter.convert(quantity, unitType, "ml"), type: 'volume' };
  }
  return { value: quantity, type: 'unit' };
};

export default function EditModal({
  entry,
  onSave,
  onClose,
  isSaving,
  isOpen,
}: EditModalProps) {
  const [editedEntry, setEditedEntry] = useState<MacroEntry | null>(null);
  const [originalEntry, setOriginalEntry] = useState<MacroEntry | null>(null);
  const [formValid, setFormValid] = useState(true);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [baseIngredientsForScaling, setBaseIngredientsForScaling] = useState<Ingredient[] | null>(null);
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  // Update editedEntry when entry prop changes (to handle fresh data from cache)
  useEffect(() => {
    if (entry) {
      const ingredientsWithBase = entry.ingredients?.map(ing => ({
        ...ing,
        protein: roundValue(ing.protein),
        carbs: roundValue(ing.carbs),
        fats: roundValue(ing.fats),
        quantity: ing.quantity === undefined ? undefined : roundValue(ing.quantity),
        baseProtein: ing.baseProtein ?? ing.protein,
        baseCarbs: ing.baseCarbs ?? ing.carbs,
        baseFats: ing.baseFats ?? ing.fats,
        baseQuantity: ing.baseQuantity ?? ing.quantity,
        baseUnit: ing.baseUnit ?? ing.unit,
      })) || [];
      
      const roundedEntry = {
        ...entry,
        protein: roundValue(entry.protein),
        carbs: roundValue(entry.carbs),
        fats: roundValue(entry.fats),
        ingredients: ingredientsWithBase,
      };

      setEditedEntry(roundedEntry);
      setOriginalEntry(roundedEntry);
      setBaseIngredientsForScaling(ingredientsWithBase);
      setScaleFactor(1);
    }
  }, [entry]);

  const hasUnsavedChanges = useMemo(() => {
    if (!originalEntry || !editedEntry) return false;
    return JSON.stringify(originalEntry) !== JSON.stringify(editedEntry);
  }, [editedEntry, originalEntry]);

  useBeforeUnload(isOpen && hasUnsavedChanges);

  // Handle close with unsaved changes check
  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  // Confirm discard changes
  const confirmDiscard = () => {
    setShowUnsavedWarning(false);
    onClose();
  };

  // Cancel discard and stay in modal
  const cancelDiscard = () => {
    setShowUnsavedWarning(false);
  };

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
            [field]: roundValue(value ?? 0),
          }
        : null,
    );
  };

  // Reset the baseline only after persistence succeeds.
  const handleSaveWithReset = () => {
    if (!formValid || !editedEntry) return;

    void Promise.resolve()
      .then(() => onSave(editedEntry))
      .then(() => {
        setOriginalEntry({ ...editedEntry });
      })
      .catch((error) => {
        handleApiError(error, "save edited macro entry");
      });
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
    setBaseIngredientsForScaling(updatedIngredients);
    setScaleFactor(1);
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
    setBaseIngredientsForScaling(updatedIngredients);
    setScaleFactor(1);
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

    const updatedIngredients = editedEntry.ingredients?.map((ing, index_) => {
      if (index_ !== index) return ing;

      let updatedIng = { ...ing };

      // Handle quantity or unit change - recalculate macros from base values
      if (field === 'quantity' || field === 'unit') {
        const newQuantity = field === 'quantity' 
          ? (typeof value === 'number' ? value : (value ? Number(value) : undefined))
          : ing.quantity;
        const newUnit = field === 'unit' ? String(value) : ing.unit;

        // Get base values - use stored base or current as base if not set
        const baseQty = ing.baseQuantity ?? ing.quantity ?? 100;
        const baseU = ing.baseUnit ?? ing.unit ?? 'g';
        const baseP = ing.baseProtein ?? ing.protein;
        const baseC = ing.baseCarbs ?? ing.carbs;
        const baseF = ing.baseFats ?? ing.fats;

        // Calculate scaling factor
        const baseNormalized = normalizeQuantity(baseQty, baseU);
        const newNormalized = normalizeQuantity(newQuantity ?? 100, newUnit ?? 'g');

        let scaleFactor = 1;
        if (baseNormalized.type === newNormalized.type && baseNormalized.value > 0) {
          scaleFactor = newNormalized.value / baseNormalized.value;
        }

        // Update the ingredient with recalculated macros
        updatedIng = {
          ...updatedIng,
          quantity: newQuantity,
          unit: newUnit,
          protein: roundValue(baseP * scaleFactor),
          carbs: roundValue(baseC * scaleFactor),
          fats: roundValue(baseF * scaleFactor),
        };
      } else {
        // Regular field update (name, protein, carbs, fats)
        const stringFields = ['name', 'unit'];
        const isStringField = stringFields.includes(field as string);
        
        updatedIng = {
          ...updatedIng,
          [field]: isStringField ? value : roundValue(Number(value) || 0),
        };
        
        // If macros changed directly, update base values to track new reference
        if (field === 'protein' || field === 'carbs' || field === 'fats') {
          const currentQty = ing.quantity ?? 100;
          const currentUnit = ing.unit ?? 'g';
          updatedIng = {
            ...updatedIng,
            baseProtein: field === 'protein' ? roundValue(Number(value)) : ing.protein,
            baseCarbs: field === 'carbs' ? roundValue(Number(value)) : ing.carbs,
            baseFats: field === 'fats' ? roundValue(Number(value)) : ing.fats,
            baseQuantity: currentQty,
            baseUnit: currentUnit,
          };
        }
      }

      return updatedIng;
    }) || [];

    const totals = calculateTotalsFromIngredients(updatedIngredients);
    setBaseIngredientsForScaling(updatedIngredients);
    setScaleFactor(1);
    setEditedEntry({
      ...editedEntry,
      ingredients: updatedIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  const hasIngredients = editedEntry?.ingredients && editedEntry.ingredients.length > 0;

  // Scale all ingredients by a factor
  const handleScaleIngredients = (newFactor: number) => {
    if (!editedEntry || !baseIngredientsForScaling || baseIngredientsForScaling.length === 0) return;

    setScaleFactor(newFactor);
    const scaledIngredients = baseIngredientsForScaling.map((ing) => ({
      ...ing,
      protein: roundValue(ing.protein * newFactor),
      carbs: roundValue(ing.carbs * newFactor),
      fats: roundValue(ing.fats * newFactor),
      quantity: ing.quantity ? roundValue(ing.quantity * newFactor) : undefined,
    }));

    const totals = calculateTotalsFromIngredients(scaledIngredients);
    setEditedEntry({
      ...editedEntry,
      ingredients: scaledIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  // Don't render if no entry data
  if (!editedEntry) return null;

  return (
    <>
      {showUnsavedWarning && (
        <Modal
          isOpen={showUnsavedWarning}
          onClose={cancelDiscard}
          title="Unsaved Changes"
          variant="form"
          onSave={confirmDiscard}
          saveLabel="Discard Changes"
          cancelLabel="Keep Editing"
          size="sm"
        >
          <p className="text-sm text-foreground">
            You have unsaved changes. If you leave now, your changes will be lost.
          </p>
        </Modal>
      )}

      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Edit Nutrition Entry"
        variant="form"
        onSave={handleSaveWithReset}
        saveDisabled={!formValid || isSaving || !hasUnsavedChanges}
        size="2xl"
      >
        <div className="space-y-5 md:space-y-6">
          <MealDetailsSection
            mealName={String(editedEntry.mealName)}
            protein={editedEntry.protein}
            carbs={editedEntry.carbs}
            fats={editedEntry.fats}
            onMealNameChange={(value) => handleInputChange("mealName", value)}
            onMacroChange={handleNumberChange}
          />
          <IngredientsPanel
            ingredients={editedEntry.ingredients || []}
            hasIngredients={Boolean(hasIngredients)}
            showIngredients={showIngredients}
            scaleFactor={scaleFactor}
            onToggle={() => setShowIngredients(!showIngredients)}
            onScale={handleScaleIngredients}
            onUpdateIngredient={updateIngredient}
            onRemoveIngredient={removeIngredient}
            onAddIngredient={addIngredient}
          />
        </div>
      </Modal>
    </>
  );
}

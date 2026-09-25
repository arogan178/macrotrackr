import { useEffect, useMemo, useState } from "react";

import Modal from "@/components/ui/Modal";
import IngredientsPanel from "@/features/macroTracking/components/edit-modal/IngredientsPanel";
import MealDetailsSection from "@/features/macroTracking/components/edit-modal/MealDetailsSection";
import {
  calculateTotalsFromIngredients,
  getGramsEquivalent,
  roundValue,
  scaleIngredient,
} from "@/features/macroTracking/utils/ingredientScaling";
import type { UnitType } from "@/features/macroTracking/utils/units";
import { useBeforeUnload } from "@/hooks";
import { Ingredient, MacroEntry } from "@/types/macro";
import { handleApiError } from "@/utils/errorHandling";

interface EditModalProps {
  entry: MacroEntry | undefined;
  onSave: (entry: MacroEntry) => void | Promise<void>;
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
  const [originalEntry, setOriginalEntry] = useState<MacroEntry | null>(null);
  const [formValid, setFormValid] = useState(true);
  const [showIngredients, setShowIngredients] = useState(true);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [baseIngredientsForScaling, setBaseIngredientsForScaling] = useState<
    Ingredient[] | null
  >(null);
  const [scaleFactor, setScaleFactor] = useState<number>(1);

  // Single-item / manual entry scaling state
  const [singleQuantity, setSingleQuantity] = useState<number | undefined>(100);
  const [singleUnit, setSingleUnit] = useState<UnitType>("g");
  const [singleBaseProtein, setSingleBaseProtein] = useState<number>(0);
  const [singleBaseCarbs, setSingleBaseCarbs] = useState<number>(0);
  const [singleBaseFats, setSingleBaseFats] = useState<number>(0);
  const [singleBaseQuantity, setSingleBaseQuantity] = useState<number>(100);
  const [singleBaseUnit, setSingleBaseUnit] = useState<UnitType>("g");

  // Update editedEntry when entry prop changes
  useEffect(() => {
    if (entry) {
      const ingredientsWithBase =
        entry.ingredients?.map((ing) => ({
          ...ing,
          protein: roundValue(ing.protein),
          carbs: roundValue(ing.carbs),
          fats: roundValue(ing.fats),
          quantity:
            ing.quantity === undefined ? undefined : roundValue(ing.quantity),
          baseProtein: ing.baseProtein ?? ing.protein,
          baseCarbs: ing.baseCarbs ?? ing.carbs,
          baseFats: ing.baseFats ?? ing.fats,
          baseQuantity: ing.baseQuantity ?? ing.quantity,
          baseUnit: ing.baseUnit ?? ing.unit,
        })) ?? [];

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

      const firstIng = ingredientsWithBase[0];
      const initialQty = firstIng?.quantity ?? 100;
      const initialUnit = (firstIng?.unit as UnitType) ?? "g";

      setSingleQuantity(initialQty);
      setSingleUnit(initialUnit);
      setSingleBaseProtein(firstIng?.baseProtein ?? roundValue(entry.protein));
      setSingleBaseCarbs(firstIng?.baseCarbs ?? roundValue(entry.carbs));
      setSingleBaseFats(firstIng?.baseFats ?? roundValue(entry.fats));
      setSingleBaseQuantity(firstIng?.baseQuantity ?? initialQty);
      setSingleBaseUnit((firstIng?.baseUnit as UnitType) ?? initialUnit);
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
        editedEntry.entryDate !== "" &&
        editedEntry.entryTime !== "" &&
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
            [field]: value,
          }
        : null,
    );
  };

  const isMultiIngredient = Boolean(
    editedEntry?.ingredients && editedEntry.ingredients.length > 1,
  );

  // Single-item / manual entry quantity and unit change
  const handleSingleQuantityUnitChange = (
    newQty: number | undefined,
    newUnit: UnitType,
  ) => {
    setSingleQuantity(newQty);
    setSingleUnit(newUnit);
    if (!editedEntry) return;

    const isPcsUnit = (u?: string) =>
      u === "unit" ||
      u === "pcs" ||
      u === "pc" ||
      u === "piece" ||
      u === "pieces";

    const qtyValue = newQty ?? (isPcsUnit(newUnit) ? 1 : 100);

    const baseGrams = getGramsEquivalent(
      singleBaseQuantity,
      singleBaseUnit,
    );
    const targetGrams = getGramsEquivalent(qtyValue, newUnit);

    let factor = 1;
    if (baseGrams > 0) {
      factor = targetGrams / baseGrams;
    }

    const newP = roundValue(singleBaseProtein * factor);
    const newC = roundValue(singleBaseCarbs * factor);
    const newF = roundValue(singleBaseFats * factor);

    let updatedIngredients = editedEntry.ingredients;
    if (editedEntry.ingredients?.length === 1) {
      updatedIngredients = [
        {
          ...editedEntry.ingredients[0],
          quantity: newQty,
          unit: newUnit,
          protein: newP,
          carbs: newC,
          fats: newF,
        },
      ];
    }

    setEditedEntry({
      ...editedEntry,
      protein: newP,
      carbs: newC,
      fats: newF,
      ingredients: updatedIngredients,
    });
  };

  const handleSingleQuantityChange = (newQty: number | undefined) => {
    handleSingleQuantityUnitChange(newQty, singleUnit);
  };

  const handleSingleUnitChange = (newUnit: UnitType) => {
    handleSingleQuantityUnitChange(singleQuantity, newUnit);
  };

  // Single-item / manual entry macro change
  const handleSingleMacroChange = (
    field: "protein" | "carbs" | "fats",
    value: number | undefined,
  ) => {
    if (!editedEntry) return;
    const numValue = roundValue(value ?? 0);

    const updatedP = field === "protein" ? numValue : editedEntry.protein;
    const updatedC = field === "carbs" ? numValue : editedEntry.carbs;
    const updatedF = field === "fats" ? numValue : editedEntry.fats;

    const currentQty = singleQuantity ?? 100;
    const currentU = singleUnit;

    setSingleBaseProtein(updatedP);
    setSingleBaseCarbs(updatedC);
    setSingleBaseFats(updatedF);
    setSingleBaseQuantity(currentQty);
    setSingleBaseUnit(currentU);

    let updatedIngredients = editedEntry.ingredients;
    if (editedEntry.ingredients?.length === 1) {
      updatedIngredients = [
        {
          ...editedEntry.ingredients[0],
          [field]: numValue,
          baseProtein: updatedP,
          baseCarbs: updatedC,
          baseFats: updatedF,
          baseQuantity: currentQty,
          baseUnit: currentU,
        },
      ];
    }

    setEditedEntry({
      ...editedEntry,
      protein: updatedP,
      carbs: updatedC,
      fats: updatedF,
      ingredients: updatedIngredients,
    });
  };

  // Convert single item or manual entry to multi-ingredient meal
  const handleConvertToMultiIngredient = () => {
    if (!editedEntry) return;

    let currentIngredients = editedEntry.ingredients ?? [];
    if (currentIngredients.length === 0) {
      const firstIng: Ingredient = {
        name: editedEntry.mealName || "Ingredient 1",
        protein: editedEntry.protein,
        carbs: editedEntry.carbs,
        fats: editedEntry.fats,
        quantity: singleQuantity,
        unit: singleUnit,
        baseProtein: singleBaseProtein,
        baseCarbs: singleBaseCarbs,
        baseFats: singleBaseFats,
        baseQuantity: singleBaseQuantity,
        baseUnit: singleBaseUnit,
      };
      const secondIng: Ingredient = {
        name: "",
        protein: 0,
        carbs: 0,
        fats: 0,
      };
      currentIngredients = [firstIng, secondIng];
    } else if (currentIngredients.length === 1) {
      const secondIng: Ingredient = {
        name: "",
        protein: 0,
        carbs: 0,
        fats: 0,
      };
      currentIngredients = [...currentIngredients, secondIng];
    }

    const totals = calculateTotalsFromIngredients(currentIngredients);
    setBaseIngredientsForScaling(currentIngredients);
    setScaleFactor(1);
    setShowIngredients(true);

    setEditedEntry({
      ...editedEntry,
      ingredients: currentIngredients,
      protein: totals.protein,
      carbs: totals.carbs,
      fats: totals.fats,
    });
  };

  // Reset baseline only after persistence succeeds
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

  // Multi-ingredient management functions
  const addIngredient = () => {
    if (!editedEntry) return;
    const newIngredient: Ingredient = {
      name: "",
      protein: 0,
      carbs: 0,
      fats: 0,
    };
    const updatedIngredients = [
      ...(editedEntry.ingredients ?? []),
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
    const updatedIngredients =
      editedEntry.ingredients?.filter((_, index_) => index_ !== index) ?? [];
    const totals = calculateTotalsFromIngredients(updatedIngredients);

    if (updatedIngredients.length === 1) {
      const remaining = updatedIngredients[0];
      setSingleQuantity(remaining.quantity ?? 100);
      setSingleUnit((remaining.unit as UnitType) ?? "g");
      setSingleBaseProtein(remaining.baseProtein ?? remaining.protein);
      setSingleBaseCarbs(remaining.baseCarbs ?? remaining.carbs);
      setSingleBaseFats(remaining.baseFats ?? remaining.fats);
      setSingleBaseQuantity(remaining.baseQuantity ?? remaining.quantity ?? 100);
      setSingleBaseUnit((remaining.baseUnit as UnitType) ?? (remaining.unit as UnitType) ?? "g");
    }

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
    value: string | number | undefined,
  ) => {
    if (!editedEntry) return;

    const updatedIngredients =
      editedEntry.ingredients?.map((ing, index_) => {
        if (index_ !== index) return ing;

        let updatedIng = { ...ing };

        if (field === "quantity" || field === "unit") {
          const newQuantity =
            field === "quantity"
              ? typeof value === "number"
                ? value
                : value
                  ? Number(value)
                  : undefined
              : ing.quantity;
          const newUnit = field === "unit" ? String(value) : ing.unit;

          updatedIng = scaleIngredient(ing, newQuantity, newUnit);
        } else {
          const stringFields = ["name", "unit"];
          const isStringField = stringFields.includes(field as string);

          updatedIng = {
            ...updatedIng,
            [field]: isStringField ? value : roundValue(Number(value) || 0),
          };

          if (field === "protein" || field === "carbs" || field === "fats") {
            const currentQty = ing.quantity ?? 100;
            const currentUnit = ing.unit ?? "g";
            updatedIng = {
              ...updatedIng,
              baseProtein:
                field === "protein" ? roundValue(Number(value)) : ing.protein,
              baseCarbs:
                field === "carbs" ? roundValue(Number(value)) : ing.carbs,
              baseFats:
                field === "fats" ? roundValue(Number(value)) : ing.fats,
              baseQuantity: currentQty,
              baseUnit: currentUnit,
            };
          }
        }

        return updatedIng;
      }) ?? [];

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

  // Scale all ingredients by a factor
  const handleScaleIngredients = (newFactor: number) => {
    if (
      !editedEntry ||
      !baseIngredientsForScaling ||
      baseIngredientsForScaling.length === 0
    )
      return;

    setScaleFactor(newFactor);
    const scaledIngredients = baseIngredientsForScaling.map((ing) => ({
      ...ing,
      protein: roundValue(ing.protein * newFactor),
      carbs: roundValue(ing.carbs * newFactor),
      fats: roundValue(ing.fats * newFactor),
      quantity: ing.quantity
        ? roundValue(ing.quantity * newFactor)
        : undefined,
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
            mealType={editedEntry.mealType}
            entryDate={editedEntry.entryDate}
            entryTime={editedEntry.entryTime}
            protein={editedEntry.protein}
            carbs={editedEntry.carbs}
            fats={editedEntry.fats}
            quantity={singleQuantity}
            unit={singleUnit}
            isMultiIngredient={isMultiIngredient}
            onMealNameChange={(value) => handleInputChange("mealName", value)}
            onMealTypeChange={(value) => handleInputChange("mealType", value)}
            onEntryDateChange={(value) => handleInputChange("entryDate", value)}
            onEntryTimeChange={(value) => handleInputChange("entryTime", value)}
            onMacroChange={
              isMultiIngredient
                ? () => {}
                : handleSingleMacroChange
            }
            onQuantityChange={
              isMultiIngredient ? undefined : handleSingleQuantityChange
            }
            onUnitChange={
              isMultiIngredient ? undefined : handleSingleUnitChange
            }
            onQuantityUnitChange={
              isMultiIngredient ? undefined : handleSingleQuantityUnitChange
            }
            onAddIngredient={
              isMultiIngredient ? undefined : handleConvertToMultiIngredient
            }
          />

          {isMultiIngredient && (
            <IngredientsPanel
              ingredients={editedEntry.ingredients ?? []}
              hasIngredients
              showIngredients={showIngredients}
              scaleFactor={scaleFactor}
              onToggle={() => setShowIngredients(!showIngredients)}
              onScale={handleScaleIngredients}
              onUpdateIngredient={updateIngredient}
              onRemoveIngredient={removeIngredient}
              onAddIngredient={addIngredient}
            />
          )}
        </div>
      </Modal>
    </>
  );
}

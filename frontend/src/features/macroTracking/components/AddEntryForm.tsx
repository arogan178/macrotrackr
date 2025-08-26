import { memo, useCallback, useEffect, useState } from "react";

import {
  CardContainer,
  DateField,
  Dropdown,
  NumberField,
  QuantityUnitField,
  TextField,
  TimeField,
} from "@/components/form";
import { Button, CheckMarkIcon, TrashIcon } from "@/components/ui";
import CalorieSearch from "@/features/macroTracking/components/CalorieSearchForm";
import { MealType } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";
import { MEAL_TYPE_OPTIONS } from "../constants";
import { UnitConverter, type UnitType } from "../utils/units";

interface AddEntryProps {
  onSubmit: (entry: {
    protein: number;
    carbs: number;
    fats: number;
    mealType: MealType;
    mealName: string;
    entryDate: string;
    entryTime: string;
  }) => Promise<void>;
  isSaving: boolean;
}

function AddEntry({ onSubmit, isSaving: _isSaving }: AddEntryProps) {
  const [protein, setProtein] = useState<number | undefined>();
  const [carbs, setCarbs] = useState<number | undefined>();
  const [fats, setFats] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number | undefined>(100);
  const [unit, setUnit] = useState<UnitType>("g");
  const [baseMacros, setBaseMacros] = useState<
    | {
        protein: number;
        carbs: number;
        fats: number;
      }
    | undefined
  >();

  const [searchResult, setSearchResult] = useState<string | undefined>();
  // Helper: get current hour in user's local time
  const currentHour = new Date().getHours();

  // Define time ranges for each meal type
  const mealTypeTimeRanges = {
    breakfast: { start: 5, end: 10 }, // 5am–10am
    lunch: { start: 11, end: 15 }, // 11am–3pm
    dinner: { start: 17, end: 22 }, // 5pm–10pm
    snack: { start: 0, end: 23 }, // Snacks always available
  };

  // Function to get default meal type based on current time
  const getDefaultMealType = () => {
    if (
      currentHour >= mealTypeTimeRanges.breakfast.start &&
      currentHour <= mealTypeTimeRanges.breakfast.end
    ) {
      return "breakfast";
    }
    if (
      currentHour >= mealTypeTimeRanges.lunch.start &&
      currentHour <= mealTypeTimeRanges.lunch.end
    ) {
      return "lunch";
    }
    if (
      currentHour >= mealTypeTimeRanges.dinner.start &&
      currentHour <= mealTypeTimeRanges.dinner.end
    ) {
      return "dinner";
    }
    return "snack";
  };

  const [mealType, setMealType] = useState<MealType>(getDefaultMealType());
  const [mealName, setMealName] = useState<string>("");

  const [entryDate, setEntryDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [entryTime, setEntryTime] = useState<string>(
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  );

  // Effect to recalculate macros when quantity, unit, or baseMacros change
  useEffect(() => {
    if (baseMacros && typeof quantity === "number" && quantity > 0) {
      // Convert the quantity to grams for consistent macro calculations
      // Base macros are always per 100g, so we need to calculate the factor accordingly
      let quantityInGrams: number;

      if (UnitConverter.isWeightUnit(unit)) {
        // Convert weight units to grams
        quantityInGrams = UnitConverter.convert(quantity, unit, "g");
      } else if (UnitConverter.isVolumeUnit(unit)) {
        // For volume units, we'll keep them as-is since macros are typically per volume for liquids
        // But we still need to handle the conversion for display purposes
        quantityInGrams = UnitConverter.convert(quantity, unit, "ml");
      } else {
        // For unit items (like pieces), treat as 100g equivalent
        quantityInGrams = quantity * 100;
      }

      // Calculate macros based on the converted quantity
      const factor = quantityInGrams / 100; // Macros are per 100g/ml
      setProtein(Number((baseMacros.protein * factor).toFixed(1)));
      setCarbs(Number((baseMacros.carbs * factor).toFixed(1)));
      setFats(Number((baseMacros.fats * factor).toFixed(1)));
    } else if (!baseMacros) {
      // Clear macros when no base macros are selected
      setProtein(undefined);
      setCarbs(undefined);
      setFats(undefined);
    }
  }, [quantity, unit, baseMacros]);

  const calories = Math.round(
    calculateCaloriesFromMacros(protein || 0, carbs || 0, fats || 0),
  );

  const anyFieldIsUndefined =
    protein === undefined || carbs === undefined || fats === undefined;
  const allFieldsAreZero = protein === 0 && carbs === 0 && fats === 0;
  const isFormValid =
    !anyFieldIsUndefined && !allFieldsAreZero && mealName.trim() !== "";

  const handleSearchResult = useCallback(
    ({
      protein: p,
      carbs: c,
      fats: f,
      name,
      servingQuantity,
      servingUnit,
    }: {
      protein: string;
      carbs: string;
      fats: string;
      name: string;
      servingQuantity: number;
      servingUnit: string;
    }) => {
      const per100g = {
        protein: Number.parseFloat(p),
        carbs: Number.parseFloat(c),
        fats: Number.parseFloat(f),
      };
      setBaseMacros(per100g);
      setMealName(name);
      setQuantity(servingQuantity);
      // Convert to appropriate units - prefer metric but keep original unit for better UX
      // This allows users to work in their preferred units while ensuring calculations work
      const originalUnit = servingUnit as UnitType;

      // If it's lbs, convert to kg for better metric consistency
      if (originalUnit === "lb") {
        const metric = UnitConverter.toMetric(servingQuantity, originalUnit);
        setUnit(metric.unit);
        setQuantity(metric.quantity);
      } else {
        // For other units, keep as-is but ensure they're valid UnitType
        setUnit(originalUnit);
        setQuantity(servingQuantity);
      }
      setSearchResult(`Selected: ${name}`);
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setBaseMacros(undefined);
    setMealName("");
    setSearchResult(undefined);
    setProtein(undefined);
    setCarbs(undefined);
    setFats(undefined);
    setQuantity(100);
    setUnit("g" as UnitType);
  }, []);

  // When user manually edits a macro, break the link to the search result
  const handleManualMacroChange =
    (setter: (value: number | undefined) => void) =>
    (value: number | undefined) => {
      setter(value);
      setBaseMacros(undefined);
    };

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!isFormValid) return;

      await onSubmit({
        protein: protein as number,
        carbs: carbs as number,
        fats: fats as number,
        mealType,
        mealName,
        entryDate,
        entryTime,
      });

      handleClearSearch();
    },
    [
      protein,
      carbs,
      fats,
      mealType,
      mealName,
      entryDate,
      entryTime,
      onSubmit,
      isFormValid,
      handleClearSearch,
    ],
  );

  return (
    <CardContainer>
      <div className="p-5">
        <h2 className="mb-4 text-lg font-medium text-foreground">
          Add Today's Macros
        </h2>

        <div className="mb-6">
          <CalorieSearch onResult={handleSearchResult} />
          {searchResult && (
            <div className="mt-3 flex items-center justify-between text-sm text-success">
              <div className="flex items-center">
                <CheckMarkIcon className="mr-2 h-4 w-4" />
                {searchResult}
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="flex items-center text-xs text-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <TrashIcon className="mr-1 h-4 w-4" />
                Clear
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-start">
            <div className="sm:col-span-1">
              <QuantityUnitField
                label="Quantity/Unit"
                quantity={quantity}
                unit={unit}
                onQuantityChange={setQuantity}
                onUnitChange={setUnit}
                disabled={!baseMacros}
                placeholder="100"
              />
            </div>
            <div className="sm:col-span-2">
              <TextField
                label="Meal Name"
                value={mealName}
                onChange={setMealName}
                placeholder="e.g. Chicken Salad"
                required
              />
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <DateField
              label="Date"
              value={entryDate}
              onChange={setEntryDate}
              required
            />
            <TimeField
              label="Time"
              value={entryTime}
              onChange={setEntryTime}
              required
            />
            <Dropdown
              label="Meal Type"
              options={MEAL_TYPE_OPTIONS.map((option) => ({
                value: option.value,
                label: option.display,
              }))}
              value={mealType}
              onChange={(value: string | number | undefined) =>
                setMealType(value as MealType)
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField
              label="Protein"
              value={protein}
              onChange={handleManualMacroChange(setProtein)}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Carbs"
              value={carbs}
              onChange={handleManualMacroChange(setCarbs)}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Fats"
              value={fats}
              onChange={handleManualMacroChange(setFats)}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm text-foreground">
              Total Calories:{" "}
              <span className="font-medium text-primary">{calories}</span>
            </div>
            {allFieldsAreZero && (
              <div className="mr-4 text-sm text-vibrant-accent">
                Macros must be greater than 0
              </div>
            )}
            {!mealName.trim() && !anyFieldIsUndefined && (
              <div className="mr-4 text-sm text-vibrant-accent">
                Please provide a meal name
              </div>
            )}
            <Button
              type="submit"
              disabled={!isFormValid}
              autoLoadingFeature="macros"
              loadingText="Saving..."
              text="Add Entry"
              variant="primary"
            />
          </div>
        </form>
      </div>
    </CardContainer>
  );
}

export default memo(AddEntry);

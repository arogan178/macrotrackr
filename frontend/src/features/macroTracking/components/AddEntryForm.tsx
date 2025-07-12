import { memo, useCallback, useState, useMemo, useEffect } from "react";

import {
  CardContainer,
  DateField,
  Dropdown,
  FormButton,
  NumberField,
  TextField,
  TimeField,
} from "@/components/form";
import { CheckMarkIcon, TrashIcon } from "@/components/ui";
import CalorieSearch from "@/features/macroTracking/components/CalorieSearchForm";
import { MealType } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";
import { MEAL_TYPE_OPTIONS } from "../constants";

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

function AddEntry({ onSubmit, isSaving }: AddEntryProps) {
  const [protein, setProtein] = useState<number | undefined>();
  const [carbs, setCarbs] = useState<number | undefined>();
  const [fats, setFats] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState("g");
  const [baseMacros, setBaseMacros] = useState<{
    protein: number;
    carbs: number;
    fats: number;
  } | null>(null);

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

  // Effect to recalculate macros when quantity or baseMacros change
  useEffect(() => {
    if (baseMacros) {
      const factor = quantity / 100; // Macros are per 100g
      setProtein(Number((baseMacros.protein * factor).toFixed(1)));
      setCarbs(Number((baseMacros.carbs * factor).toFixed(1)));
      setFats(Number((baseMacros.fats * factor).toFixed(1)));
    }
  }, [quantity, baseMacros]);

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
      setUnit(servingUnit);
      setSearchResult(`Selected: ${name}`);
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setBaseMacros(null);
    setMealName("");
    setSearchResult(undefined);
    setProtein(undefined);
    setCarbs(undefined);
    setFats(undefined);
    setQuantity(100);
    setUnit("g");
  }, []);

  // When user manually edits a macro, break the link to the search result
  const handleManualMacroChange =
    (setter: (val: number | undefined) => void) =>
    (value: number | undefined) => {
      setter(value);
      setBaseMacros(null);
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
        <h2 className="text-lg font-medium text-gray-200 mb-4">
          Add Today's Macros
        </h2>

        <div className="mb-6">
          <CalorieSearch onResult={handleSearchResult} />
          {searchResult && (
            <div className="mt-3 text-sm text-green-400 flex items-center justify-between">
              <div className="flex items-center">
                <CheckMarkIcon className="w-4 h-4 mr-2" />
                {searchResult}
              </div>
              <button
                type="button"
                onClick={handleClearSearch}
                className="text-xs text-gray-400 hover:text-white flex items-center"
                aria-label="Clear search"
              >
                <TrashIcon className="w-4 h-4 mr-1" />
                Clear
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="sm:col-span-1">
              <NumberField
                label="Quantity"
                value={quantity}
                onChange={setQuantity}
                disabled={!baseMacros}
                min={0}
                step={1}
                unit={unit}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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
              onChange={(value) => setMealType(value as MealType)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

          <div className="mt-5 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Total Calories:{" "}
              <span className="text-indigo-400 font-medium">{calories}</span>
            </div>
            {allFieldsAreZero && (
              <div className="text-sm text-red-400 mr-4">
                Macros must be greater than 0
              </div>
            )}
            {!mealName.trim() && !anyFieldIsUndefined && (
              <div className="text-sm text-red-400 mr-4">
                Please provide a meal name
              </div>
            )}
            <FormButton
              type="submit"
              disabled={isSaving || !isFormValid}
              isLoading={isSaving}
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

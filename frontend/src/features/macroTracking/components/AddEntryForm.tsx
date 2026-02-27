import { AnimatePresence, motion } from "motion/react";
import { memo, useCallback, useEffect, useState } from "react";

import {
  CardContainer,
  DateField,
  Dropdown,
  NumberField,
  QuantityUnitField,
  TimeField,
} from "@/components/form";
import { formStyles } from "@/components/form/Styles";
import { Button, PlusIcon, TrashIcon } from "@/components/ui";
import CalorieSearch from "@/features/macroTracking/components/CalorieSearchForm";
import { cn } from "@/lib/classnameUtilities";
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
  const currentHour = new Date().getHours();

  const mealTypeTimeRanges = {
    breakfast: { start: 5, end: 10 }, // 5am–10am
    lunch: { start: 11, end: 15 }, // 11am–3pm
    dinner: { start: 17, end: 22 }, // 5pm–10pm
    snack: { start: 0, end: 23 }, // Snacks always available
  };

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

  useEffect(() => {
    if (baseMacros && typeof quantity === "number" && quantity > 0) {
      let quantityInGrams: number;

      if (UnitConverter.isWeightUnit(unit)) {
        quantityInGrams = UnitConverter.convert(quantity, unit, "g");
      } else if (UnitConverter.isVolumeUnit(unit)) {
        quantityInGrams = UnitConverter.convert(quantity, unit, "ml");
      } else {
        quantityInGrams = quantity * 100;
      }

      const factor = quantityInGrams / 100;
      setProtein(Number((baseMacros.protein * factor).toFixed(1)));
      setCarbs(Number((baseMacros.carbs * factor).toFixed(1)));
      setFats(Number((baseMacros.fats * factor).toFixed(1)));
    } else if (!baseMacros) {
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

      let displayUnit = servingUnit as UnitType;

      const validUnits: UnitType[] = [
        "g",
        "kg",
        "oz",
        "lb",
        "ml",
        "L",
        "cup",
        "tbsp",
        "tsp",
        "pt",
        "unit",
      ];
      if (!validUnits.includes(displayUnit)) {
        displayUnit = "g";
      }

      if (displayUnit === "lb") {
        const metric = UnitConverter.toMetric(servingQuantity, displayUnit);
        setUnit(metric.unit);
        setQuantity(metric.quantity);
      } else {
        setUnit(displayUnit);
        setQuantity(servingQuantity);
      }
      setSearchResult(name);
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
    <CardContainer
      variant="interactive"
      className="relative flex h-full flex-col justify-between overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-linear-to-b from-surface to-surface-2 opacity-50"></div>
      <div className="relative z-10 p-5">
        <div className="mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
            Log a Meal
          </h2>
        </div>

        <div className="mb-5">
          <CalorieSearch onResult={handleSearchResult} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3 sm:items-start">
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
              <div className="space-y-2">
                <div className="relative flex items-center">
                  <label htmlFor="meal-name-input" className={formStyles.label}>
                    Meal Name
                  </label>
                  <AnimatePresence>
                    {(searchResult || mealName.length > 0) && (
                      <motion.button
                        type="button"
                        onClick={handleClearSearch}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs text-muted transition-colors hover:bg-error/10 hover:text-error"
                        aria-label="Clear search"
                        title="Clear search result"
                      >
                        <TrashIcon className="h-3 w-3" />
                        Clear
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <input
                  id="meal-name-input"
                  type="text"
                  value={mealName}
                  onChange={(event_) => setMealName(event_.target.value)}
                  placeholder="e.g. Chicken Salad"
                  required
                  className={cn(formStyles.input.base, formStyles.input.normal)}
                />
              </div>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
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

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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

          <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium tracking-wide text-muted uppercase">
                Total Calories
              </div>
              <div className="text-2xl font-light tracking-tight text-foreground">
                {calories}
              </div>
            </div>
            {allFieldsAreZero && (
              <div className="mr-4 rounded-md bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
                Macros must be greater than 0
              </div>
            )}
            {!mealName.trim() && !anyFieldIsUndefined && (
              <div className="mr-4 rounded-md bg-warning/10 px-3 py-1.5 text-xs font-medium text-warning">
                Please provide a meal name
              </div>
            )}
            <Button
              type="submit"
              disabled={!isFormValid || _isSaving}
              isLoading={_isSaving}
              text={_isSaving ? "Saving..." : "Add Entry"}
              icon={
                <PlusIcon 
                  className={cn(
                    "mr-2 h-4 w-4 transition-transform duration-300",
                    isFormValid && !_isSaving ? "group-hover:rotate-90" : ""
                  )} 
                />
              }
              iconPosition="left"
              buttonSize="lg"
              variant="primary"
              className="group min-w-40 font-medium transition-colors duration-200"
            />
          </div>
        </form>
      </div>
    </CardContainer>
  );
}

export default memo(AddEntry);

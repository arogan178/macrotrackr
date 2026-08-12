import { memo, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import CardContainer from "@/components/form/CardContainer";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import { formStyles } from "@/components/form/FormStyles";
import NumberField from "@/components/form/NumberField";
import QuantityUnitField from "@/components/form/QuantityUnitField";
import TimeField from "@/components/form/TimeField";
import { Button, PlusIcon, StarIcon, TrashIcon } from "@/components/ui";
import CalorieSearch from "@/features/macroTracking/components/CalorieSearchForm";
import { cn } from "@/lib/classnameUtilities";
import { type Ingredient, MealType } from "@/types/macro";

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
    ingredients?: Ingredient[];
    saveAsMeal?: boolean;
  }) => Promise<void>;
  isSaving: boolean;
}

function getFactor(
  quantity: number | undefined,
  unit: UnitType,
): number | undefined {
  if (typeof quantity !== "number" || quantity <= 0) return undefined;
  if (unit === "unit") return quantity;
  let qtyInGrams: number;
  if (UnitConverter.isWeightUnit(unit)) {
    qtyInGrams = UnitConverter.convert(quantity, unit, "g");
  } else if (UnitConverter.isVolumeUnit(unit)) {
    qtyInGrams = UnitConverter.convert(quantity, unit, "ml");
  } else {
    qtyInGrams = quantity * 100;
  }
  return qtyInGrams / 100;
}

function AddEntry({ onSubmit, isSaving: _isSaving }: AddEntryProps) {
  const [protein, setProtein] = useState<number | undefined>();
  const [carbs, setCarbs] = useState<number | undefined>();
  const [fats, setFats] = useState<number | undefined>();
  const [quantity, setQuantity] = useState<number | undefined>(100);
  const [unit, setUnit] = useState<UnitType>("g");
  const [saveAsMeal, setSaveAsMeal] = useState(false);
  const [baseMacros, setBaseMacros] = useState<
    | {
        protein: number;
        carbs: number;
        fats: number;
      }
    | undefined
  >();
  const [baseIngredients, setBaseIngredients] = useState<
    Ingredient[] | undefined
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

  const [loggedNow] = useState(() => ({
    date: new Date().toISOString().split("T")[0],
    time: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }),
  }));
  const [entryDate, setEntryDate] = useState<string>(loggedNow.date);
  const [entryTime, setEntryTime] = useState<string>(loggedNow.time);
  const isLoggedNow =
    entryDate === loggedNow.date && entryTime === loggedNow.time;

  useEffect(() => {
    const factor = getFactor(quantity, unit);
    if (baseMacros && factor !== undefined) {
      setProtein(Number((baseMacros.protein * factor).toFixed(1)));
      setCarbs(Number((baseMacros.carbs * factor).toFixed(1)));
      setFats(Number((baseMacros.fats * factor).toFixed(1)));
    }
  }, [quantity, unit, baseMacros]);

  const calories = Math.round(
    calculateCaloriesFromMacros(protein ?? 0, carbs ?? 0, fats ?? 0),
  );

  const anyFieldIsUndefined =
    protein === undefined || carbs === undefined || fats === undefined;
  const allFieldsAreZero = protein === 0 && carbs === 0 && fats === 0;
  const isFormValid =
    !anyFieldIsUndefined && !allFieldsAreZero && mealName.trim() !== "";

  // Shown at every breakpoint: a disabled button with no reason is a dead end
  // on mobile, where the old hints were hidden.
  const validationHint = isFormValid
    ? undefined
    : mealName.trim() === ""
      ? "Name this meal to save it"
      : anyFieldIsUndefined
        ? "Enter protein, carbs and fats"
        : "Macros must add up to more than 0";

  const handleSearchResult = useCallback(
    ({
      protein: p,
      carbs: c,
      fats: f,
      name,
      servingQuantity,
      servingUnit,
      rawQuantity,
    }: {
      protein: string;
      carbs: string;
      fats: string;
      name: string;
      servingQuantity: number;
      servingUnit: string;
      rawQuantity?: string;
    }) => {
      const per100g = {
        protein: Number.parseFloat(p),
        carbs: Number.parseFloat(c),
        fats: Number.parseFloat(f),
      };

      let targetQuantity = servingQuantity;
      let targetUnit = servingUnit as UnitType;

      if (rawQuantity) {
        const parsed = UnitConverter.parseQuantity(rawQuantity);
        targetUnit = parsed.unit;
        targetQuantity = parsed.quantity;
      } else {
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
        if (!validUnits.includes(targetUnit)) {
          targetUnit = "g";
        }

        if (targetUnit === "lb") {
          const metric = UnitConverter.toMetric(servingQuantity, targetUnit);
          targetUnit = metric.unit;
          targetQuantity = metric.quantity;
        }
      }

      setBaseMacros(per100g);
      setBaseIngredients(undefined);
      setMealName(name);
      setUnit(targetUnit);
      setQuantity(targetQuantity);
      setSearchResult(name);

      let qtyInGrams: number;
      if (UnitConverter.isWeightUnit(targetUnit)) {
        qtyInGrams = UnitConverter.convert(targetQuantity, targetUnit, "g");
      } else if (UnitConverter.isVolumeUnit(targetUnit)) {
        qtyInGrams = UnitConverter.convert(targetQuantity, targetUnit, "ml");
      } else {
        qtyInGrams = targetQuantity * 100;
      }

      const factor = qtyInGrams / 100;
      setProtein(Number((per100g.protein * factor).toFixed(1)));
      setCarbs(Number((per100g.carbs * factor).toFixed(1)));
      setFats(Number((per100g.fats * factor).toFixed(1)));
    },
    [],
  );

  const handleClearSearch = useCallback(() => {
    setBaseMacros(undefined);
    setBaseIngredients(undefined);
    setMealName("");
    setSearchResult(undefined);
    setProtein(undefined);
    setCarbs(undefined);
    setFats(undefined);
    setQuantity(100);
    setUnit("g" as UnitType);
    setSaveAsMeal(false);
  }, []);

  const handleManualMacroChange =
    (
      setter: (value: number | undefined) => void,
      field: "protein" | "carbs" | "fats",
    ) =>
    (value: number | undefined) => {
      setter(value);
      setBaseIngredients(undefined);

      const currentValues = {
        protein: field === "protein" ? value : protein,
        carbs: field === "carbs" ? value : carbs,
        fats: field === "fats" ? value : fats,
      };

      const factor = getFactor(quantity, unit);
      if (
        factor !== undefined &&
        factor > 0 &&
        currentValues.protein !== undefined &&
        currentValues.carbs !== undefined &&
        currentValues.fats !== undefined
      ) {
        setBaseMacros({
          protein: currentValues.protein / factor,
          carbs: currentValues.carbs / factor,
          fats: currentValues.fats / factor,
        });
      } else {
        setBaseMacros(undefined);
      }
    };

  const handleSelectSavedMeal = useCallback(
    (meal: {
      name: string;
      protein: number;
      carbs: number;
      fats: number;
      mealType: string;
      ingredients?: Ingredient[];
    }) => {
      if (meal.ingredients && meal.ingredients.length > 0) {
        setBaseIngredients(meal.ingredients);
        setMealName(meal.name);
        setProtein(meal.protein);
        setCarbs(meal.carbs);
        setFats(meal.fats);

        if (meal.ingredients.length === 1) {
          const ing = meal.ingredients[0];
          let derivedBaseMacros:
            | { protein: number; carbs: number; fats: number }
            | undefined;

          if (
            typeof ing.baseProtein === "number" &&
            typeof ing.baseCarbs === "number" &&
            typeof ing.baseFats === "number"
          ) {
            derivedBaseMacros = {
              protein: ing.baseProtein,
              carbs: ing.baseCarbs,
              fats: ing.baseFats,
            };
          } else if (typeof ing.quantity === "number" && ing.quantity > 0) {
            const ingUnit = (ing.unit as UnitType) ?? "g";
            if (ingUnit === "unit") {
              derivedBaseMacros = {
                protein: ing.protein / ing.quantity,
                carbs: ing.carbs / ing.quantity,
                fats: ing.fats / ing.quantity,
              };
            } else {
              let qtyInGrams: number;
              if (UnitConverter.isWeightUnit(ingUnit)) {
                qtyInGrams = UnitConverter.convert(ing.quantity, ingUnit, "g");
              } else if (UnitConverter.isVolumeUnit(ingUnit)) {
                qtyInGrams = UnitConverter.convert(ing.quantity, ingUnit, "ml");
              } else {
                qtyInGrams = ing.quantity * 100;
              }
              const factor = qtyInGrams / 100;
              if (factor > 0) {
                derivedBaseMacros = {
                  protein: ing.protein / factor,
                  carbs: ing.carbs / factor,
                  fats: ing.fats / factor,
                };
              }
            }
          }

          setBaseMacros(derivedBaseMacros);
          setQuantity(ing.quantity ?? 100);
          setUnit((ing.unit as UnitType) ?? "g");
        } else {
          setBaseMacros({
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          });
          setQuantity(1);
          setUnit("unit");
        }
      } else {
        setBaseMacros(undefined);
        setBaseIngredients(undefined);
        setMealName(meal.name);
        setProtein(meal.protein);
        setCarbs(meal.carbs);
        setFats(meal.fats);
        setQuantity(undefined);
        setUnit("g"); // Default to g for saved meals or arbitrary since no base macros
      }

      if (
        meal.mealType &&
        MEAL_TYPE_OPTIONS.some((o) => o.value === meal.mealType)
      ) {
        setMealType(meal.mealType as MealType);
      }
      setSearchResult(undefined);
    },
    [],
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!isFormValid) return;

      let finalIngredients = baseIngredients;
      const factor = getFactor(quantity, unit) ?? 1;

      if (baseIngredients && baseIngredients.length > 0) {
        if (baseIngredients.length === 1) {
          const ing = baseIngredients[0];
          finalIngredients = [
            {
              ...ing,
              name: ing.name || mealName,
              protein: protein as number,
              carbs: carbs as number,
              fats: fats as number,
              quantity: typeof quantity === "number" ? quantity : ing.quantity,
              unit: unit || ing.unit,
              baseProtein:
                baseMacros?.protein ?? ing.baseProtein ?? (protein as number) / factor,
              baseCarbs:
                baseMacros?.carbs ?? ing.baseCarbs ?? (carbs as number) / factor,
              baseFats:
                baseMacros?.fats ?? ing.baseFats ?? (fats as number) / factor,
              baseQuantity: ing.baseQuantity ?? (unit === "unit" ? 1 : 100),
              baseUnit: ing.baseUnit ?? (unit === "unit" ? "unit" : unit),
            },
          ];
        } else {
          finalIngredients = baseIngredients.map((ing) => ({
            ...ing,
            protein: Number((ing.protein * factor).toFixed(1)),
            carbs: Number((ing.carbs * factor).toFixed(1)),
            fats: Number((ing.fats * factor).toFixed(1)),
            quantity: ing.quantity
              ? Number((ing.quantity * factor).toFixed(1))
              : undefined,
          }));
        }
      } else {
        const effectiveBaseMacros = baseMacros ?? {
          protein: (protein as number) / factor,
          carbs: (carbs as number) / factor,
          fats: (fats as number) / factor,
        };

        finalIngredients = [
          {
            name: mealName,
            protein: protein as number,
            carbs: carbs as number,
            fats: fats as number,
            quantity: typeof quantity === "number" ? quantity : 100,
            unit,
            baseProtein: effectiveBaseMacros.protein,
            baseCarbs: effectiveBaseMacros.carbs,
            baseFats: effectiveBaseMacros.fats,
            baseQuantity: unit === "unit" ? 1 : 100,
            baseUnit:
              unit === "unit"
                ? "unit"
                : UnitConverter.isWeightUnit(unit)
                  ? "g"
                  : UnitConverter.isVolumeUnit(unit)
                    ? "ml"
                    : unit,
          },
        ];
      }

      await onSubmit({
        protein: protein as number,
        carbs: carbs as number,
        fats: fats as number,
        mealType,
        mealName,
        entryDate,
        entryTime,
        ingredients: finalIngredients,
        saveAsMeal,
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
      baseMacros,
      baseIngredients,
      quantity,
      unit,
      saveAsMeal,
    ],
  );

  return (
    <CardContainer
      variant="interactive"
      className="relative flex h-full flex-col justify-between overflow-hidden"
    >
      <div className="relative z-10 p-3.5 sm:p-5">
        <div className="mb-4 sm:mb-5">
          <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
            Log a Meal
          </h2>
        </div>

        <div className="mb-4 sm:mb-5">
          <CalorieSearch
            onResult={handleSearchResult}
            onSelectSavedMeal={handleSelectSavedMeal}
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3.5 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 sm:items-start">
            <div className="col-span-1">
              <QuantityUnitField
                label="Quantity/Unit"
                quantity={quantity}
                unit={unit}
                onQuantityChange={setQuantity}
                onUnitChange={setUnit}
                placeholder="100"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="space-y-2">
                <div className="relative flex h-6 items-center justify-between">
                  <label htmlFor="meal-name-input" className={formStyles.label}>
                    Meal Name
                  </label>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setSaveAsMeal((previous) => !previous)}
                      className={cn(
                        "flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer",
                        saveAsMeal
                          ? "bg-amber-500/15 text-amber-500 hover:bg-amber-500/25 dark:bg-amber-400/20 dark:text-amber-300"
                          : "text-muted hover:bg-muted/10 hover:text-foreground",
                      )}
                      aria-label="Save as Meal"
                      title={saveAsMeal ? "Will save as reusable meal" : "Save as reusable meal"}
                    >
                      <StarIcon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          saveAsMeal ? "fill-current text-amber-500 dark:text-amber-300" : "",
                        )}
                      />
                      <span>{saveAsMeal ? "Saved as Meal" : "Save as Meal"}</span>
                    </button>
                    <AnimatePresence>
                      {(searchResult ?? mealName.length > 0) && (
                        <motion.button
                          type="button"
                          onClick={handleClearSearch}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-1 rounded-md px-1.5 sm:px-2 py-0.5 text-xs text-muted transition-colors hover:bg-error/10 hover:text-error"
                          aria-label="Clear search"
                          title="Clear search result"
                        >
                          <TrashIcon className="h-3 w-3" />
                          <span className="hidden sm:inline">Clear</span>
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
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

          <div className="mb-3.5 sm:mb-5">
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

          {/* Date and time default to now and are rarely changed, so they stay
              out of the way until asked for. */}
          <details className="mb-3.5 sm:mb-5 group">
            <summary className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-foreground">
              Logged {isLoggedNow ? "now" : `${entryDate} at ${entryTime}`}
              <span className="ml-1.5 underline decoration-border underline-offset-4 group-open:hidden">
                change
              </span>
            </summary>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
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
            </div>
          </details>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
            <NumberField
              label="Protein"
              value={protein}
              onChange={handleManualMacroChange(setProtein, "protein")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Carbs"
              value={carbs}
              onChange={handleManualMacroChange(setCarbs, "carbs")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Fats"
              value={fats}
              onChange={handleManualMacroChange(setFats, "fats")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
          </div>

          <div className="mt-4 sm:mt-5 flex flex-row items-center justify-between gap-2 sm:gap-3 border-t border-border/40 pt-3.5 sm:pt-4">
            <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0 min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted truncate">
                Total Calories
              </span>
              <span className="text-lg sm:text-2xl font-light tracking-tight text-foreground whitespace-nowrap">
                {calories}
                <span className="ml-1 text-xs font-normal text-muted">kcal</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {validationHint && (
                <p className="text-right text-xs text-muted">
                  {validationHint}
                </p>
              )}
              <Button
                type="submit"
                disabled={!isFormValid || _isSaving}
                isLoading={_isSaving}
                text={_isSaving ? "Saving..." : "Add Entry"}
                leftIcon={
                  <PlusIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                }
                buttonSize="sm"
                variant="primary"
                className="font-semibold text-xs sm:text-sm px-3 py-1.5 sm:px-5 sm:py-2 shrink-0 whitespace-nowrap"
              />
            </div>
          </div>
        </form>
      </div>
    </CardContainer>
  );
}

export default memo(AddEntry);

import { memo, useCallback, useEffect, useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";
import { format } from "date-fns";
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
import { todayISO } from "@/utils/dateUtilities";

import { calculateCaloriesFromMacros } from "../calculations";
import { MEAL_TYPE_OPTIONS } from "../constants";
import { UnitConverter, type UnitType } from "../utils/units";

import { formatEntryDate } from "./EntryHistoryHelpers";

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
  /** Inside the log sheet, which already supplies the card and the title. */
  inSheet?: boolean;
  /** A day other than today to log to, at the current time of day. Read on mount. */
  defaultDate?: string;
}

function currentDateTime() {
  const now = new Date();

  return { date: todayISO(now), time: format(now, "HH:mm") };
}

function FormShell({
  inSheet,
  children,
}: {
  inSheet: boolean;
  children: React.ReactNode;
}) {
  if (inSheet) return children;

  return (
    <CardContainer variant="interactive" className="relative overflow-hidden">
      <div className="relative z-10 p-3.5 sm:p-5">{children}</div>
    </CardContainer>
  );
}

// The form shows one hint, so return only the first thing to fix.
function validateEntry({
  value: { protein, carbs, fats, mealName },
}: {
  value: { protein?: number; carbs?: number; fats?: number; mealName: string };
}) {
  if (protein === undefined || carbs === undefined || fats === undefined) {
    return "Enter protein, carbs and fats";
  }
  if (protein === 0 && carbs === 0 && fats === 0) {
    return "Macros must add up to more than 0";
  }
  if (mealName.trim() === "") return "Name this meal to save it";

  return undefined;
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

function AddEntry({
  onSubmit,
  isSaving: _isSaving,
  inSheet = false,
  defaultDate,
}: AddEntryProps) {
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

  // Read once: useForm re-applies changed defaults, and these follow the clock.
  const [defaultValues] = useState(() => ({
    mealName: "",
    mealType: getDefaultMealType() as MealType,
    protein: undefined as number | undefined,
    carbs: undefined as number | undefined,
    fats: undefined as number | undefined,
    quantity: 100 as number | undefined,
    unit: "g" as UnitType,
    saveAsMeal: false,
    // Unset means "now", resolved at submit so an open form never goes stale.
    pickedDateTime: (defaultDate
      ? { date: defaultDate, time: currentDateTime().time }
      : undefined) as { date: string; time: string } | undefined,
  }));

  const form = useForm({
    defaultValues,
    // onMount keeps the button disabled before anything is entered.
    validators: { onMount: validateEntry, onChange: validateEntry },
    onSubmit: async ({ value }) => {
      const { protein, carbs, fats, quantity, unit, mealName } = value;
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

      const { date: entryDate, time: entryTime } =
        value.pickedDateTime ?? currentDateTime();

      try {
        await onSubmit({
          protein: protein as number,
          carbs: carbs as number,
          fats: fats as number,
          mealType: value.mealType,
          mealName,
          entryDate,
          entryTime,
          ingredients: finalIngredients,
          saveAsMeal: value.saveAsMeal,
        });
      } catch {
        // The caller reports the failure; keep the values so the user can retry.
        return;
      }

      handleClearSearch();
    },
  });
  const values = useStore(form.store, (state) => state.values);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const [formError] = useStore(form.store, (state) => state.errors);
  const { protein, carbs, fats, quantity, unit, mealName, saveAsMeal, pickedDateTime } =
    values;

  const shownDateTime = pickedDateTime ?? currentDateTime();
  const [isDateTimeExpanded, setIsDateTimeExpanded] = useState(false);
  const [isDateTimeRendered, setIsDateTimeRendered] = useState(false);

  const toggleDateTime = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    setIsDateTimeExpanded((open) => {
      if (open) return false;

      setIsDateTimeRendered(true);

      return true;
    });
  }, []);

  const isLoggedNow = pickedDateTime === undefined;

  useEffect(() => {
    const factor = getFactor(quantity, unit);
    if (baseMacros && factor !== undefined) {
      form.setFieldValue("protein", Number((baseMacros.protein * factor).toFixed(1)));
      form.setFieldValue("carbs", Number((baseMacros.carbs * factor).toFixed(1)));
      form.setFieldValue("fats", Number((baseMacros.fats * factor).toFixed(1)));
    }
  }, [quantity, unit, baseMacros, form]);

  const calories = Math.round(
    calculateCaloriesFromMacros(protein ?? 0, carbs ?? 0, fats ?? 0),
  );

  const allFieldsAreUndefined =
    protein === undefined && carbs === undefined && fats === undefined;

  // The hint explains why the button is disabled once values are entered,
  // without cluttering the initial empty form before interaction.
  const isFormPristine = mealName.trim() === "" && allFieldsAreUndefined;
  const validationHint = isFormPristine ? undefined : formError;

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
      form.setFieldValue("mealName", name);
      form.setFieldValue("unit", targetUnit);
      form.setFieldValue("quantity", targetQuantity);
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
      form.setFieldValue("protein", Number((per100g.protein * factor).toFixed(1)));
      form.setFieldValue("carbs", Number((per100g.carbs * factor).toFixed(1)));
      form.setFieldValue("fats", Number((per100g.fats * factor).toFixed(1)));
    },
    [form],
  );

  const handleClearSearch = useCallback(() => {
    setBaseMacros(undefined);
    setBaseIngredients(undefined);
    form.setFieldValue("mealName", "");
    setSearchResult(undefined);
    form.setFieldValue("protein", undefined);
    form.setFieldValue("carbs", undefined);
    form.setFieldValue("fats", undefined);
    form.setFieldValue("quantity", 100);
    form.setFieldValue("unit", "g");
    form.setFieldValue("saveAsMeal", false);
  }, [form]);

  const handleManualMacroChange =
    (field: "protein" | "carbs" | "fats") => (value: number | undefined) => {
      form.setFieldValue(field, value);
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
        form.setFieldValue("mealName", meal.name);
        form.setFieldValue("protein", meal.protein);
        form.setFieldValue("carbs", meal.carbs);
        form.setFieldValue("fats", meal.fats);

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
          form.setFieldValue("quantity", ing.quantity ?? 100);
          form.setFieldValue("unit", (ing.unit as UnitType) ?? "g");
        } else {
          setBaseMacros({
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
          });
          form.setFieldValue("quantity", 1);
          form.setFieldValue("unit", "unit");
        }
      } else {
        setBaseMacros(undefined);
        setBaseIngredients(undefined);
        form.setFieldValue("mealName", meal.name);
        form.setFieldValue("protein", meal.protein);
        form.setFieldValue("carbs", meal.carbs);
        form.setFieldValue("fats", meal.fats);
        form.setFieldValue("quantity", undefined);
        form.setFieldValue("unit", "g"); // Default to g for saved meals or arbitrary since no base macros
      }

      if (
        meal.mealType &&
        MEAL_TYPE_OPTIONS.some((o) => o.value === meal.mealType)
      ) {
        form.setFieldValue("mealType", meal.mealType as MealType);
      }
      setSearchResult(undefined);
    },
    [form],
  );

  return (
    <FormShell inSheet={inSheet}>
        {!inSheet && (
          <div className="mb-4 sm:mb-5">
            <h2 className="text-lg font-semibold tracking-tight text-foreground/90">
              Log a Meal
            </h2>
          </div>
        )}

        <div className="mb-4 sm:mb-5">
          <CalorieSearch
            onResult={handleSearchResult}
            onSelectSavedMeal={handleSelectSavedMeal}
            focusOnOpen={inSheet}
          />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          <div className="mb-3.5 sm:mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 sm:items-start">
            <div className="col-span-1">
              <QuantityUnitField
                label="Quantity/Unit"
                quantity={quantity}
                unit={unit}
                onQuantityChange={(value) =>
                  form.setFieldValue("quantity", value)
                }
                onUnitChange={(value) => form.setFieldValue("unit", value)}
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
                      onClick={() =>
                        form.setFieldValue("saveAsMeal", (previous) => !previous)
                      }
                      className={cn(
                        "flex items-center gap-1 rounded-control px-1.5 sm:px-2 py-0.5 text-xs font-medium transition-colors cursor-pointer",
                        saveAsMeal
                          ? "bg-primary/15 text-primary hover:bg-primary/25"
                          : "text-muted hover:bg-muted/10 hover:text-foreground",
                      )}
                      aria-label="Save as Meal"
                      title={saveAsMeal ? "Will save as reusable meal" : "Save as reusable meal"}
                    >
                      <StarIcon
                        className={cn(
                          "h-3.5 w-3.5 transition-colors",
                          saveAsMeal ? "fill-current text-primary" : "",
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
                          className="flex items-center gap-1 rounded-control px-1.5 sm:px-2 py-0.5 text-xs text-muted transition-colors hover:bg-error/10 hover:text-error"
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
                  onChange={(event_) =>
                    form.setFieldValue("mealName", event_.target.value)
                  }
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
              value={values.mealType}
              onChange={(value: string | number | undefined) =>
                form.setFieldValue("mealType", value as MealType)
              }
            />
          </div>

          {/* Date and time default to now and are rarely changed, so they stay
              out of the way until asked for. */}
          <details
            open={isDateTimeRendered}
            onToggle={(event) => {
              if (event.currentTarget.open && !isDateTimeExpanded) {
                setIsDateTimeExpanded(true);
              }
            }}
            className="mb-3.5 sm:mb-5 group"
          >
            <summary
              onClick={toggleDateTime}
              className="cursor-pointer list-none text-xs text-muted transition-colors hover:text-foreground select-none"
            >
              Logged{" "}
              {isLoggedNow
                ? "now"
                : `${formatEntryDate(shownDateTime.date)} at ${shownDateTime.time}`}
              <span
                className={cn(
                  "ml-1.5 underline decoration-border underline-offset-4",
                  isDateTimeExpanded && "hidden",
                )}
              >
                change
              </span>
            </summary>
            <div
              className="grid transition-[grid-template-rows] duration-200 ease-out"
              style={{ gridTemplateRows: isDateTimeExpanded ? "1fr" : "0fr" }}
              onTransitionEnd={() => {
                if (!isDateTimeExpanded) setIsDateTimeRendered(false);
              }}
            >
              <div className="overflow-hidden">
                <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-5">
                  <DateField
                    label="Date"
                    value={shownDateTime.date}
                    onChange={(date) =>
                      form.setFieldValue("pickedDateTime", {
                        ...shownDateTime,
                        date,
                      })
                    }
                    required
                  />
                  <TimeField
                    label="Time"
                    value={shownDateTime.time}
                    onChange={(time) =>
                      form.setFieldValue("pickedDateTime", {
                        ...shownDateTime,
                        time,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>
          </details>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
            <NumberField
              label="Protein"
              value={protein}
              onChange={handleManualMacroChange("protein")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Carbs"
              value={carbs}
              onChange={handleManualMacroChange("carbs")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
            <NumberField
              label="Fats"
              value={fats}
              onChange={handleManualMacroChange("fats")}
              min={0}
              max={500}
              step={0.1}
              unit="g"
            />
          </div>

          <div className="mt-4 sm:mt-5 flex flex-row items-center justify-between gap-2 sm:gap-3 border-t border-border pt-3.5 sm:pt-4">
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
                disabled={!canSubmit || _isSaving}
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
    </FormShell>
  );
}

export default memo(AddEntry);

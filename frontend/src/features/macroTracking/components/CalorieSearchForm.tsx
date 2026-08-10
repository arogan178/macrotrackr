import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { FoodSearchResult } from "@/api/macros";
import TextField from "@/components/form/TextField";
import {
  ArrowRightIcon,
  Button,
  ProgressiveBlur,
  SearchIcon,
  TabBar,
} from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { useFoodSearch } from "@/hooks/queries/useFoodSearch";
import { useMacroHistory } from "@/hooks/queries/useMacroQueries";
import type { Ingredient, MacroEntry } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";
import { UnitConverter, type UnitType } from "../utils/units";

import SavedMealsList from "./SavedMealsList";

interface CalorieSearchProps {
  onResult: (macros: {
    protein: string;
    carbs: string;
    fats: string;
    name: string;
    servingQuantity: number;
    servingUnit: string;
    rawQuantity?: string;
  }) => void;
  onSelectSavedMeal: (meal: {
    name: string;
    protein: number;
    carbs: number;
    fats: number;
    mealType: string;
    ingredients?: Ingredient[];
  }) => void;
  recentEntries?: MacroEntry[];
}

type ActivePanel = "results" | "savedMeals" | null;
type ActiveTab = "recents" | "savedMeals";

const CalorieSearch = memo(function CalorieSearch({
  onResult,
  onSelectSavedMeal,
  recentEntries,
}: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("recents");
  const [isAtBottom, setIsAtBottom] = useState(false);
  const wrapperReference = useRef<HTMLDivElement>(null);

  const { data: historyData, isLoading: isHistoryLoading } = useMacroHistory(
    15,
    0,
  );

  const {
    data: results = [],
    isFetching: isSearching,
    isFetched,
    error: searchError,
  } = useFoodSearch(submittedQuery);

  const rawRecents = recentEntries ?? historyData?.entries ?? [];
  const displayRecents = useMemo(() => {
    const seen = new Set<string>();
    const unique: MacroEntry[] = [];
    for (const item of rawRecents) {
      const name = (item.foodName ?? item.mealName)?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        unique.push(item);
      }
    }
    return unique.slice(0, 10);
  }, [rawRecents]);

  const trimmedQuery = query.trim();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperReference.current &&
        !wrapperReference.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!submittedQuery || isSearching) {
      return;
    }

    if (results.length > 0) {
      setActivePanel("results");

      return;
    }

    setActivePanel(null);
  }, [isSearching, results.length, submittedQuery]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setSubmittedQuery("");

    if (value.trim().length === 0) {
      setActivePanel("savedMeals");

      return;
    }

    setActivePanel(null);
  }, []);

  const handleSearch = useCallback(async () => {
    if (trimmedQuery.length < 2) {
      return;
    }

    setActivePanel(null);
    setSubmittedQuery(trimmedQuery);
  }, [trimmedQuery]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        handleSearch();
      }
    },
    [handleSearch],
  );

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = target;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setIsAtBottom(atBottom);
  }, []);

  const processFoodItemSelection = useCallback((item: FoodSearchResult) => {
    const defaultUnit = item.servingUnit as UnitType;
    const parsedQuantity = item.rawQuantity
      ? UnitConverter.parseQuantity(item.rawQuantity)
      : {
          quantity: item.servingQuantity,
          unit: defaultUnit,
          original: "",
        };

    const parsedUnit = parsedQuantity.unit as UnitType;
    const hasSupportedUnit = [
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
    ].includes(parsedUnit);

    const quantity = parsedQuantity.quantity;
    const unit = hasSupportedUnit ? parsedUnit : defaultUnit;

    return {
      protein: item.protein.toFixed(1),
      carbs: item.carbs.toFixed(1),
      fats: item.fats.toFixed(1),
      name: item.name,
      servingQuantity: quantity,
      servingUnit: unit,
      rawQuantity: item.rawQuantity,
    };
  }, []);

  const handleSelect = useCallback(
    (item: FoodSearchResult) => {
      const result = processFoodItemSelection(item);
      onResult(result);
      setActivePanel(null);
      setSubmittedQuery("");
      setQuery("");
    },
    [onResult, processFoodItemSelection],
  );

  const calculateDisplayCalories = useCallback(
    (item: FoodSearchResult): number => {
      if (item.energyKcal && item.energyKcal > 0) {
        return item.energyKcal;
      }

      return calculateCaloriesFromMacros(item.protein, item.carbs, item.fats);
    },
    [],
  );

  const getQuantityDisplay = useCallback((item: FoodSearchResult): string => {
    if (item.rawQuantity) {
      return item.rawQuantity;
    }

    if (item.servingQuantity && item.servingUnit) {
      const metric = UnitConverter.toMetric(
        item.servingQuantity,
        item.servingUnit as UnitType,
      );

      return `${metric.quantity}${metric.unit}`;
    }

    if (item.servingQuantity) {
      return `${item.servingQuantity}`;
    }

    return "";
  }, []);

  const hasNutrients = useCallback((item: FoodSearchResult): boolean => {
    return !(item.protein === 0 && item.carbs === 0 && item.fats === 0);
  }, []);

  const getPortionFactor = useCallback((item: FoodSearchResult): number => {
    const defaultUnit = (item.servingUnit || "g") as UnitType;
    const parsed = item.rawQuantity
      ? UnitConverter.parseQuantity(item.rawQuantity)
      : {
          quantity: item.servingQuantity || 100,
          unit: defaultUnit,
          original: "",
        };

    const qty = parsed.quantity;
    const unit = parsed.unit as UnitType;

    if (unit === "unit") {
      return qty;
    }

    if (UnitConverter.isWeightUnit(unit)) {
      const grams = UnitConverter.convert(qty, unit, "g");

      return grams / 100;
    }

    if (UnitConverter.isVolumeUnit(unit)) {
      const ml = UnitConverter.convert(qty, unit, "ml");

      return ml / 100;
    }

    return 1;
  }, []);

  const displayResults = useMemo(() => {
    if (activePanel !== "results" || results.length === 0) return [];

    return results
      .filter((item) => hasNutrients(item))
      .map((item, index) => {
        const factor = getPortionFactor(item);
        const baseCalories = calculateDisplayCalories(item);

        return {
          item,
          displayQuantity: getQuantityDisplay(item),
          calories: baseCalories * factor,
          protein: item.protein * factor,
          carbs: item.carbs * factor,
          fats: item.fats * factor,
          hasNutrients: hasNutrients(item),
          id: `${item.name}-${index}`,
        };
      });
  }, [
    activePanel,
    results,
    hasNutrients,
    getQuantityDisplay,
    calculateDisplayCalories,
    getPortionFactor,
  ]);

  const searchErrorMessage = searchError
    ? "Failed to search for food item. Please try again."
    : "";

  const noResultsMessage =
    submittedQuery &&
    isFetched &&
    !isSearching &&
    !searchError &&
    results.length === 0
      ? "No results found for this food item"
      : "";

  const statusMessage = searchErrorMessage || noResultsMessage;

  return (
    <div className="relative flex flex-col gap-3" ref={wrapperReference}>
      <div className="flex items-end gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <TextField
            id="calorie-search-input"
            label="Search for food"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length === 0) {
                setActivePanel("savedMeals");
              } else if (results.length > 0) {
                setActivePanel("results");
              }
            }}
            placeholder="e.g. 1 apple, 100g chicken breast"
            icon={<SearchIcon className="text-foreground!" />}
            maxLength={50}
          />
        </div>
        <div className="flex items-end shrink-0">
          <Button
            type="button"
            onClick={handleSearch}
            isLoading={isSearching}
            disabled={isSearching || trimmedQuery.length < 2}
            text="Search"
            rightIcon={<ArrowRightIcon className="ml-1 h-4 w-4" />}
            ariaLabel="Search for food"
            buttonSize="lg"
            variant="primary"
            className="px-4 sm:px-6 py-2.5 min-w-auto sm:min-w-40"
          />
        </div>
      </div>

      <AnimatePresence>
        {activePanel === "results" && displayResults.length > 0 && (
          <motion.div
            key="search-results-overlay"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 z-50 mt-2 h-64 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          >
            <div className="h-full overflow-y-auto pr-2" onScroll={handleScroll}>
              {displayResults.map((resultData) => {
                const { item, displayQuantity, calories, protein, carbs, fats } =
                  resultData;

                return (
                  <button
                    key={resultData.id}
                    className={
                      "w-full border-b border-border bg-surface px-4 py-3 text-left text-foreground transition-colors last:border-b-0 hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                    }
                    onClick={() => handleSelect(item)}
                    type="button"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-foreground">
                      {displayQuantity ? `${displayQuantity} | ` : ""}
                      Calories: {calories.toFixed(1)} kcal | Protein:{" "}
                      {protein.toFixed(1)}g, Carbs: {carbs.toFixed(1)}
                      g, Fats: {fats.toFixed(1)}g
                    </div>
                    {item.categories && (
                      <div className="text-xs text-foreground">
                        {item.categories}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <ProgressiveBlur
              direction="up"
              intensity={0.2}
              height="40px"
              show={!isAtBottom}
            />
          </motion.div>
        )}

        {activePanel === "savedMeals" && query.length === 0 && (
          <motion.div
            key="saved-meals-overlay"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-xl"
          >
            <div className="mb-3">
              <TabBar
                items={[
                  { key: "recents", label: "Recents" },
                  { key: "savedMeals", label: "Saved Meals" },
                ]}
                activeKey={activeTab}
                onChange={(key) => setActiveTab(key as ActiveTab)}
                layoutId="calorie-search-tabbar"
                size="sm"
              />
            </div>

            <AnimatePresence mode="wait">
              {activeTab === "recents" && (
                <motion.div
                  key="tab-recents"
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="max-h-60 overflow-y-auto pr-1"
                >
                  {isHistoryLoading && !recentEntries ? (
                    <div className="space-y-2 py-1">
                      {[1, 2, 3].map((index) => (
                        <div
                          key={index}
                          className="h-10 animate-pulse rounded-lg bg-surface-2"
                        />
                      ))}
                    </div>
                  ) : displayRecents.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted">
                      No recent entries found.
                    </div>
                  ) : (
                    <div className="divide-y divide-border/40">
                      {displayRecents.map((entry) => {
                        const entryName = entry.foodName ?? entry.mealName;
                        const cals = Math.round(
                          calculateCaloriesFromMacros(
                            entry.protein,
                            entry.carbs,
                            entry.fats,
                          ),
                        );

                        return (
                          <button
                            key={entry.id}
                            type="button"
                            onClick={() => {
                              onSelectSavedMeal({
                                name: entryName,
                                protein: entry.protein,
                                carbs: entry.carbs,
                                fats: entry.fats,
                                mealType: entry.mealType,
                                ingredients: entry.ingredients,
                              });
                              setSubmittedQuery("");
                              setQuery("");
                              setActivePanel(null);
                            }}
                            className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-2 focus:bg-surface-2 focus:outline-none"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">
                                {entryName}
                              </span>
                              <span className="text-xs text-muted capitalize">
                                {entry.mealType}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-muted">
                              Calories: {cals} kcal | Protein: {entry.protein}g,
                              Carbs: {entry.carbs}g, Fats: {entry.fats}g
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "savedMeals" && (
                <motion.div
                  key="tab-saved-meals"
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -6 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <SavedMealsList
                    onSelectMeal={(meal) => {
                      onSelectSavedMeal(meal);
                      setSubmittedQuery("");
                      setQuery("");
                      setActivePanel(null);
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {statusMessage && (
        <div>
          <StatusIndicator
            status={searchError ? "error" : "warning"}
            message={statusMessage}
          />
        </div>
      )}
    </div>
  );
});

export default CalorieSearch;

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TextField } from "@/components/form";
import {
  ArrowRightIcon,
  Button,
  ProgressiveBlur,
  SearchIcon,
} from "@/components/ui";
import SavedMealsList from "@/components/ui/SavedMealsList";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { useFoodSearch } from "@/hooks/queries/useFoodSearch";
import type { Ingredient } from "@/types/macro";
import type { FoodSearchResult } from "@/utils/apiServices";

import { calculateCaloriesFromMacros } from "../calculations";
import { UnitConverter, type UnitType } from "../utils/units";

interface CalorieSearchProps {
  onResult: (macros: {
    protein: string;
    carbs: string;
    fats: string;
    name: string;
    servingQuantity: number;
    servingUnit: string;
  }) => void;
  onSelectSavedMeal: (meal: {
    name: string;
    protein: number;
    carbs: number;
    fats: number;
    mealType: string;
    ingredients?: Ingredient[];
  }) => void;
}

type ActivePanel = "results" | "savedMeals" | null;

const CalorieSearch = memo(function CalorieSearch({
  onResult,
  onSelectSavedMeal,
}: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);
  const wrapperReference = useRef<HTMLDivElement>(null);
  const {
    data: results = [],
    isFetching: isSearching,
    isFetched,
    error: searchError,
  } = useFoodSearch(submittedQuery);

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
    let quantity = item.servingQuantity;
    let unit = item.servingUnit;

    if (item.rawQuantity) {
      const raw = item.rawQuantity.toLowerCase().trim();

      const patterns = [
        /([\d,.]+)\s*(ml|milliliter|milliliters|l|liter|liters|fl\s*oz|cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|pt|pint|pints)/,
        /([\d,.]+)\s*(g|gram|grams|kg|kilogram|kilograms|oz|ounce|ounces|lb|lbs|pound|pounds)/,
      ];

      for (const pattern of patterns) {
        const match = raw.match(pattern);
        if (match?.[1] && match[2]) {
          quantity = Number.parseFloat(match[1].replace(",", "."));
          const rawUnit = match[2];

          const unitMap: Record<string, UnitType> = {
            ml: "ml",
            milliliter: "ml",
            milliliters: "ml",
            l: "L",
            liter: "L",
            liters: "L",
            fl: "ml", // fl oz will be handled separately
            oz: "ml", // fl oz will be handled separately
            cup: "cup",
            cups: "cup",
            tbsp: "tbsp",
            tablespoon: "tbsp",
            tablespoons: "tbsp",
            tsp: "tsp",
            teaspoon: "tsp",
            teaspoons: "tsp",
            pt: "pt",
            pint: "pt",
            pints: "pt",
            g: "g",
            gram: "g",
            grams: "g",
            kg: "kg",
            kilogram: "kg",
            kilograms: "kg",
            lb: "lb",
            lbs: "lb",
            pound: "lb",
            pounds: "lb",
          };

          if (raw.includes("fl") && raw.includes("oz")) {
            unit = "ml";
            quantity = quantity * 29.5735;
          } else {
            unit = unitMap[rawUnit] || "g";
          }

          break;
        }
      }
    }

    if (unit === "g" && item.rawQuantity) {
      const raw = item.rawQuantity.toLowerCase();
      if (raw.includes("ml") || raw.includes("milliliter")) {
        unit = "ml";
      } else if (raw.includes("l") || raw.includes("liter")) {
        unit = "L";
      } else if (raw.includes("cup")) {
        unit = "cup";
      } else if (raw.includes("tbsp") || raw.includes("tablespoon")) {
        unit = "tbsp";
      } else if (raw.includes("tsp") || raw.includes("teaspoon")) {
        unit = "tsp";
      } else if (raw.includes("pt") || raw.includes("pint")) {
        unit = "pt";
      }
    }

    const metric = UnitConverter.toMetric(quantity, unit as UnitType);

    return {
      protein: item.protein.toFixed(1),
      carbs: item.carbs.toFixed(1),
      fats: item.fats.toFixed(1),
      name: item.name,
      servingQuantity: metric.quantity,
      servingUnit: unit,
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

  const displayResults = useMemo(() => {
    if (activePanel !== "results" || results.length === 0) return [];

    return results
      .filter((item) => hasNutrients(item))
      .map((item, index) => ({
        item,
        displayQuantity: getQuantityDisplay(item),
        calories: calculateDisplayCalories(item),
        hasNutrients: hasNutrients(item),
        id: `${item.name}-${index}`,
      }));
  }, [
    activePanel,
    results,
    hasNutrients,
    getQuantityDisplay,
    calculateDisplayCalories,
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
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
        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleSearch}
            isLoading={isSearching}
            disabled={isSearching || trimmedQuery.length < 2}
            text="Search"
            icon={<ArrowRightIcon className="ml-1 h-4 w-4" />}
            iconPosition="right"
            ariaLabel="Search for food"
            buttonSize="lg"
            variant="primary"
            className="min-w-40 px-6 py-2.5"
          />
        </div>
      </div>

      {activePanel === "results" && displayResults.length > 0 && (
        <div className="absolute top-full left-0 z-50 mt-2 h-64 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="h-full overflow-y-auto pr-2" onScroll={handleScroll}>
            {displayResults.map((resultData) => {
              const { item, displayQuantity, calories } = resultData;
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
                    {item.protein.toFixed(1)}g, Carbs: {item.carbs.toFixed(1)}
                    g, Fats: {item.fats.toFixed(1)}g
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
        </div>
      )}

      {activePanel === "savedMeals" && query.length === 0 && (
        <div className="absolute top-full left-0 z-50 mt-2 w-full overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-xl">
          <SavedMealsList
            onSelectMeal={(meal) => {
              onSelectSavedMeal(meal);
              setSubmittedQuery("");
              setQuery("");
              setActivePanel(null);
            }}
          />
        </div>
      )}

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

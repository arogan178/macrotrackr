import { memo, useCallback, useMemo, useState } from "react";

import { TextField } from "@/components/form";
import {
  ArrowRightIcon,
  Button,
  ProgressiveBlur,
  SearchIcon,
} from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { apiService } from "@/utils/apiServices";

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
}

interface FoodResult {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
  rawQuantity?: string;
}

const CalorieSearch = memo(function CalorieSearch({
  onResult,
}: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    setResults([]);
    setShowResults(false);
    setError("");
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setShowResults(false);
    setResults([]);

    try {
      const result = await apiService.macros.search(query.trim());
      if (Array.isArray(result) && result.length > 0) {
        setResults(result);
        setShowResults(true);
      } else {
        setError("No results found for this food item");
      }
    } catch (error) {
      console.error("Food search failed:", error);
      setError("Failed to search for food item. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query]);

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

  const processFoodItemSelection = useCallback((item: FoodResult) => {
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
        if (match && match[1] && match[2]) {
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
    (item: FoodResult) => {
      const result = processFoodItemSelection(item);
      onResult(result);
      setShowResults(false);
      setResults([]);
      setQuery("");
    },
    [onResult, processFoodItemSelection],
  );

  const calculateDisplayCalories = useCallback((item: FoodResult): number => {
    if (item.energyKcal && item.energyKcal > 0) {
      return item.energyKcal;
    }
    return calculateCaloriesFromMacros(item.protein, item.carbs, item.fats);
  }, []);

  const getQuantityDisplay = useCallback((item: FoodResult): string => {
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

  const hasNutrients = useCallback((item: FoodResult): boolean => {
    return !(item.protein === 0 && item.carbs === 0 && item.fats === 0);
  }, []);

  const displayResults = useMemo(() => {
    if (!showResults || results.length === 0) return [];

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
    results,
    showResults,
    hasNutrients,
    getQuantityDisplay,
    calculateDisplayCalories,
  ]);

  return (
    <div className="relative flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <TextField
            id="calorie-search-input"
            label="Search for food"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 1 apple, 100g chicken breast"
            icon={<SearchIcon className="text-muted" />}
            maxLength={50}
          />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={handleSearch}
            isLoading={loading}
            disabled={loading || !query}
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

      {showResults && displayResults.length > 0 && (
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

      {error && (
        <div>
          <StatusIndicator status="error" message={error} />
        </div>
      )}
    </div>
  );
});

export default CalorieSearch;

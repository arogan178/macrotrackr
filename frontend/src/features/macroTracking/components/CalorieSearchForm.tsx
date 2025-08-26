import { memo, useCallback, useMemo, useState } from "react";

import { TextField } from "@/components/form";
import { ArrowRightIcon, Button, SearchIcon } from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { apiService } from "@/utils/apiServices";

import { calculateCaloriesFromMacros } from "../calculations";
import { UnitConverter, type UnitType } from "../utils/units";

// Types for better type safety
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

interface SearchResultDisplayData {
  item: FoodResult;
  displayQuantity: string;
  calories: number;
  hasNutrients: boolean;
}

const CalorieSearch = memo(function CalorieSearch({
  onResult,
}: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [showResults, setShowResults] = useState(false);

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

  // Convert to metric for display and selection (moved to module scope)

  // Memoized function to process food item selection
  const processFoodItemSelection = useCallback((item: FoodResult) => {
    let quantity = item.servingQuantity;
    let unit = item.servingUnit;

    // If unit is 'unit' and rawQuantity contains a gram value, extract it
    if (unit === "unit" && item.rawQuantity) {
      const raw = item.rawQuantity;
      // Match e.g. '90 g' or '90g'
      const match = raw.match(/(\d+(?:[,.]\d+)?)\s*g/);
      if (match) {
        quantity = Number.parseFloat(match[1].replace(",", "."));
        unit = "g";
      }
    }

    const metric = UnitConverter.toMetric(quantity, unit as UnitType);
    return {
      protein: item.protein.toFixed(1),
      carbs: item.carbs.toFixed(1),
      fats: item.fats.toFixed(1),
      name: item.name,
      servingQuantity: metric.quantity,
      servingUnit: metric.unit,
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

  // Memoized function to calculate calories for display
  const calculateDisplayCalories = useCallback((item: FoodResult): number => {
    if (item.energyKcal && item.energyKcal > 0) {
      return item.energyKcal;
    }
    // Fallback: calculate from macros if energyKcal is not available
    return calculateCaloriesFromMacros(item.protein, item.carbs, item.fats);
  }, []);

  // Memoized function to get quantity display string
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

  // Memoized function to check if item has meaningful nutrients
  const hasNutrients = useCallback((item: FoodResult): boolean => {
    return !(item.protein === 0 && item.carbs === 0 && item.fats === 0);
  }, []);

  // Memoized filtered and processed results for display
  const displayResults = useMemo(() => {
    if (!showResults || results.length === 0) return [];

    return results
      .filter((item) => hasNutrients(item))
      .map((item, index) => ({
        item,
        displayQuantity: getQuantityDisplay(item),
        calories: calculateDisplayCalories(item),
        hasNutrients: hasNutrients(item),
        id: `${item.name}-${index}`, // Unique key for React
      }));
  }, [
    results,
    showResults,
    hasNutrients,
    getQuantityDisplay,
    calculateDisplayCalories,
  ]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <TextField
            id="calorie-search-input"
            label="Search for food"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 1 apple, 100g chicken breast"
            icon={<SearchIcon className=" text-muted" />}
            maxLength={50}
          />
          {showResults && displayResults.length > 0 && (
            <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded border border-border bg-surface shadow-surface">
              {displayResults.map((resultData) => {
                const { item, displayQuantity, calories } = resultData;
                return (
                  <button
                    key={resultData.id}
                    className={
                      "w-full border-b border-border bg-surface px-4 py-2 text-left text-foreground last:border-b-0 hover:bg-surface focus:bg-surface focus:outline-none"
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
          )}
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
      {error && (
        <div>
          <StatusIndicator status="error" message={error} />
        </div>
      )}
    </div>
  );
});

export default CalorieSearch;

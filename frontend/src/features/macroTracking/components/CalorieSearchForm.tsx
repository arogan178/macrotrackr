import { useState } from "react";

import { TextField } from "@/components/form";
import { ArrowRightIcon, Button, SearchIcon } from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { apiService } from "@/utils/apiServices";

// Helper moved to module scope to satisfy unicorn/consistent-function-scoping
function getMetricServing(quantity: number, unit: string) {
  if (unit === "oz")
    return { quantity: +(quantity * 28.3495).toFixed(2), unit: "g" };
  if (unit === "lbs")
    return { quantity: +(quantity * 0.453_592).toFixed(3), unit: "kg" };
  // Keep liters and other units as-is
  return { quantity, unit };
}

type CalorieSearchProps = {
  onResult: (macros: {
    protein: string;
    carbs: string;
    fats: string;
    name: string;
    servingQuantity: number;
    servingUnit: string;
  }) => void;
};

type FoodResult = {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  energyKcal: number;
  categories: string;
  servingQuantity: number;
  servingUnit: string;
};

export default function CalorieSearch({ onResult }: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FoodResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setResults([]);
    setShowResults(false);
    setError("");
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    setShowResults(false);
    setResults([]);

    try {
      const result: any = await apiService.macros.search(query);
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
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  // Convert to metric for display and selection (moved to module scope)

  const handleSelect = (item: FoodResult) => {
    let quantity = item.servingQuantity;
    let unit = item.servingUnit;
    // If unit is 'unit' and rawQuantity contains a gram value, use that
    if (unit === "unit" && (item as any).rawQuantity) {
      const raw = (item as any).rawQuantity as string;
      // Match e.g. '90 g' or '90g'
      const match = raw.match(/(\d+(?:[,.]\d+)?)\s*g/);
      if (match) {
        quantity = Number.parseFloat(match[1].replace(",", "."));
        unit = "g";
      }
    }
    const metric = getMetricServing(quantity, unit);
    onResult({
      protein: item.protein.toFixed(1),
      carbs: item.carbs.toFixed(1),
      fats: item.fats.toFixed(1),
      name: item.name,
      servingQuantity: metric.quantity,
      servingUnit: metric.unit,
    });
    setShowResults(false);
    setResults([]);
    setQuery("");
  };

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
            error={error}
          />
          {error && (
            <div className="mt-2">
              <StatusIndicator status="error" message={error} />
            </div>
          )}
          {showResults && results.length > 0 && (
            <div className="absolute z-10 mt-2 max-h-64 w-full overflow-y-auto rounded border border-border bg-surface shadow-surface">
              {results
                .filter(
                  (item) =>
                    !(
                      item.protein === 0 &&
                      item.carbs === 0 &&
                      item.fats === 0
                    ),
                )
                .map((item, index) => {
                  // Calculate calories (energyKcal) if available, otherwise compute from macros
                  let calories = item.energyKcal;
                  if (
                    (calories === undefined || calories === 0) &&
                    (item.protein !== 0 || item.carbs !== 0 || item.fats !== 0)
                  ) {
                    calories =
                      item.protein * 4 + item.carbs * 4 + item.fats * 9;
                  }
                  // Prefer rawQuantity if present, fallback to parsed quantity/unit
                  let quantityDisplay = "";
                  if ((item as any).rawQuantity) {
                    quantityDisplay = (item as any).rawQuantity;
                  } else if (item.servingQuantity && item.servingUnit) {
                    const metric = getMetricServing(
                      item.servingQuantity,
                      item.servingUnit,
                    );
                    quantityDisplay = `${metric.quantity}${metric.unit}`;
                  } else if (item.servingQuantity) {
                    quantityDisplay = `${item.servingQuantity}`;
                  } else if ((item as any).quantity) {
                    quantityDisplay = `${(item as any).quantity}`;
                  }
                  // Ensure all rows are fully readable (no opacity or disabled style)
                  return (
                    <button
                      key={index}
                      className={
                        "w-full border-b border-border bg-surface px-4 py-2 text-left text-foreground last:border-b-0 hover:bg-surface focus:bg-surface focus:outline-none"
                      }
                      onClick={() => handleSelect(item)}
                      type="button"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-foreground">
                        {quantityDisplay ? `${quantityDisplay} | ` : ""}
                        {calories === undefined
                          ? ""
                          : `Calories: ${calories.toFixed(1)} kcal | `}
                        Protein: {item.protein.toFixed(1)}g, Carbs:{" "}
                        {item.carbs.toFixed(1)}g, Fats: {item.fats.toFixed(1)}g
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
    </div>
  );
}

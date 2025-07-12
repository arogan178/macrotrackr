import { useState } from "react";

import { TextField } from "@/components/form";
import FormButton from "@/components/form/FormButton";
import { ArrowRightIcon, SearchIcon } from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import { apiService } from "@/utils/apiServices";

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

  const handleSelect = (item: FoodResult) => {
    onResult({
      protein: item.protein.toFixed(1),
      carbs: item.carbs.toFixed(1),
      fats: item.fats.toFixed(1),
      name: item.name,
      servingQuantity: item.servingQuantity,
      servingUnit: item.servingUnit,
    });
    setShowResults(false);
    setResults([]);
    setQuery("");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <TextField
            id="calorie-search-input"
            label="Search for food"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 1 apple, 100g chicken breast"
            icon={<SearchIcon className="w-5 h-5" />}
            maxLength={50}
            error={error}
          />
          {error && (
            <div className="mt-2">
              <StatusIndicator status="error" message={error} />
            </div>
          )}
          {showResults && results.length > 0 && (
            <div className="absolute z-10 bg-white border border-gray-200 rounded shadow-md mt-2 w-full max-h-64 overflow-y-auto">
              {results.map((item, idx) => {
                // Calculate calories (energyKcal) if available
                const calories =
                  item.energyKcal !== undefined ? item.energyKcal : null;
                // Prefer rawQuantity if present, fallback to parsed quantity/unit
                let quantityDisplay = "";
                if ((item as any).rawQuantity) {
                  quantityDisplay = (item as any).rawQuantity;
                } else if (item.servingQuantity && item.servingUnit) {
                  quantityDisplay = `${item.servingQuantity}${item.servingUnit}`;
                } else if (item.servingQuantity) {
                  quantityDisplay = `${item.servingQuantity}`;
                } else if ((item as any).quantity) {
                  quantityDisplay = `${(item as any).quantity}`;
                }
                return (
                  <button
                    key={idx}
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    onClick={() => handleSelect(item)}
                    type="button"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">
                      {/* Always show quantity/serving size if available */}
                      {quantityDisplay ? `${quantityDisplay} | ` : ""}
                      {/* Show calories if available */}
                      {calories !== null
                        ? `Calories: ${calories.toFixed(1)} kcal | `
                        : ""}
                      Protein: {item.protein.toFixed(1)}g, Carbs:{" "}
                      {item.carbs.toFixed(1)}g, Fats: {item.fats.toFixed(1)}g
                    </div>
                    {item.categories && (
                      <div className="text-xs text-gray-400">
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
          <FormButton
            type="button"
            onClick={handleSearch}
            isLoading={loading}
            disabled={loading || !query}
            text="Search"
            icon={<ArrowRightIcon className="w-4 h-4 ml-1" />}
            iconPosition="right"
            ariaLabel="Search for food"
            buttonSize="lg"
            variant="primary"
            className="min-w-[160px] px-6 py-2.5"
          />
        </div>
      </div>
    </div>
  );
}

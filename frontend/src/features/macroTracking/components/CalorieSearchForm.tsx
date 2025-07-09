import { useState } from "react";
import { SearchIcon, ArrowRightIcon } from "@/components/ui";
import StatusIndicator from "@/components/ui/StatusIndicator";
import FormButton from "@/components/form/FormButton";
import { TextField } from "@/components/form";

type CalorieSearchProps = {
  onResult: (macros: {
    protein: string;
    carbs: string;
    fats: string;
    name: string;
  }) => void;
};

export default function CalorieSearch({ onResult }: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleQueryChange = (value: string) => {
    if (value.length === 0) setQuery("");
    else setQuery(value.charAt(0).toUpperCase() + value.slice(1));
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");

    // Regex to parse quantity and food name from the query
    const match =
      query.match(/^(\d*\.?\d+)\s*g\s*(.*)$/i) ||
      query.match(/^(\d*\.?\d+)\s*(.*)$/i);
    let quantity = 100; // Default to 100g if no quantity is specified
    let foodName = query;

    if (match) {
      quantity = parseFloat(match[1]);
      foodName = match[2].trim();
    }

    try {
      const appId = import.meta.env.VITE_EDAMAM_APP_ID;
      const appKey = import.meta.env.VITE_EDAMAM_APP_KEY;
      const url = `https://api.edamam.com/api/food-database/v2/parser?app_id=${appId}&app_key=${appKey}&ingr=${encodeURIComponent(
        foodName,
      )}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.parsed && data.parsed.length > 0) {
        const food = data.parsed[0].food;
        const nutrients = food.nutrients;

        // The API returns nutrients per 100g. We calculate based on the user's quantity.
        const multiplier = quantity / 100;

        onResult({
          protein: ((nutrients.PROCNT || 0) * multiplier).toFixed(1),
          carbs: ((nutrients.CHOCDF || 0) * multiplier).toFixed(1),
          fats: ((nutrients.FAT || 0) * multiplier).toFixed(1),
          name: query, // Use the original query as the name
        });
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
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

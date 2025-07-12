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

    try {
      const result: any = await apiService.macros.search(query);

      if (result && result.nutriments) {
        const { nutriments } = result;
        onResult({
          protein: (nutriments.proteins_100g || 0).toFixed(1),
          carbs: (nutriments.carbohydrates_100g || 0).toFixed(1),
          fats: (nutriments.fat_100g || 0).toFixed(1),
          name: result.name || query,
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
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

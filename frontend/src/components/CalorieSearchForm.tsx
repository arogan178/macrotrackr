import { useState } from "react";
import {
  SearchIcon,
  ArrowRightIcon,
  LoadingSpinnerIcon,
  WarningIcon,
} from "./Icons";
import { TextField } from "./FormComponents";

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
  const [lastQuery, setLastQuery] = useState("");

  const handleQueryChange = (value: string) => {
    if (value.length === 0) setQuery("");
    else setQuery(value.charAt(0).toUpperCase() + value.slice(1));
  };

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
    setError("");
    try {
      const apiKey = import.meta.env.VITE_CALORIE_NINJA_API_KEY;
      const url = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(
        query
      )}`;
      const response = await fetch(url, {
        headers: { "X-Api-Key": apiKey },
      });
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const first = data.items[0];
        onResult({
          protein: String(first.protein_g),
          carbs: String(first.carbohydrates_total_g),
          fats: String(first.fat_total_g),
          name: query, // Use the query as the name
        });
        setLastQuery(query);
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
            label="Search for food"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="e.g. 1 apple, 100g chicken breast"
            icon={<SearchIcon className="w-5 h-5" />}
            maxLength={50}
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={handleSearch}
            disabled={loading || !query}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800/50 
                        disabled:text-gray-400 rounded-lg shadow-md transition-colors
                        text-white font-medium flex items-center min-w-[160px] justify-center"
            type="button"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinnerIcon className="mr-2 animate-spin" />
                Searching
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <span>Search</span>
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </span>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-400 text-sm flex items-center gap-2">
          <WarningIcon className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

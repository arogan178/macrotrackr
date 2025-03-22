import { useState } from "react";
import {
  SearchIcon,
  ArrowRightIcon,
  LoadingSpinnerIcon,
  WarningIcon,
} from "./Icons";

type CalorieSearchProps = {
  onResult: (macros: { protein: string; carbs: string; fats: string }) => void;
};

export default function CalorieSearch({ onResult }: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastQuery, setLastQuery] = useState("");

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

  const handleClearMessages = () => {
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-900/20 to-blue-900/20 rounded-xl border border-indigo-500/20">
      <div className="p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="w-5 h-5 text-gray-500 group-focus-within:text-indigo-400 transition-colors" />
            </div>
            <div className="group w-full">
              <input
                type="text"
                className="w-full pl-10 px-4 py-3 bg-gray-700/70 border-2 border-gray-600/50 rounded-xl text-gray-100 
                         focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none
                         transition-all duration-200 shadow-sm group-hover:border-gray-500/50"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 1 apple, 100g chicken breast"
              />
            </div>
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !query}
            className="px-6 py-3 rounded-xl font-medium text-white whitespace-nowrap
                     bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02]
                     shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2
                     focus:ring-2 focus:ring-indigo-500/50 focus:outline-none relative
                     before:absolute before:inset-0 before:bg-black/10 before:rounded-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <LoadingSpinnerIcon className="w-4 h-4 -ml-1 mr-2 animate-spin" />
                Searching...
              </span>
            ) : (
              <>
                <span>Search</span>
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-2 text-red-400 text-sm flex items-center gap-2">
            <WarningIcon className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

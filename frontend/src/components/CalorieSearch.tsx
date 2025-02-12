import { useState } from "react";
import apikey from "./.env";

type CalorieSearchProps = {
  onResult: (macros: { protein: string; carbs: string; fats: string }) => void;
};

export default function CalorieSearch({ onResult }: CalorieSearchProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query) return;
    setLoading(true);
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
      }
    } catch (error) {
      console.error("Food search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-lg bg-gray-800 border border-gray-700 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <span className="text-gray-300">What did you eat today?</span>
        <div className="flex-1 flex gap-2 w-full">
          <input
            type="text"
            className="flex-1 border rounded px-3 py-2 bg-gray-700 border-gray-600 text-gray-100 focus:border-blue-500 focus:ring-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter food item..."
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
}

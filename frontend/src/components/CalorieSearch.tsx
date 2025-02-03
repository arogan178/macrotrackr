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
      const apiKey = "***REMOVED***"; // Replace with your API key
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
    <div className="p-4 rounded">
      <div className="flex items-center">
        <span>What did you eat today? </span>
        <input
          type="text"
          className="border p-2 mr-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter food item..."
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>
    </div>
  );
}

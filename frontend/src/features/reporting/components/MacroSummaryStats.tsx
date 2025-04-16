import { NutritionAverage } from "../types";

interface MacroSummaryStatsProps {
  averages: NutritionAverage;
  isLoading: boolean;
}

export default function MacroSummaryStats({
  averages,
  isLoading,
}: MacroSummaryStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
        <span className="text-sm text-gray-400 mb-1">Avg. Daily Calories</span>
        <span className="text-2xl font-bold text-white">
          {isLoading ? "-" : averages.calories}
        </span>
      </div>
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
        <span className="text-sm text-gray-400 mb-1">Avg. Daily Protein</span>
        <span className="text-2xl font-bold text-green-400">
          {isLoading ? "-" : `${averages.protein}g`}
        </span>
      </div>
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
        <span className="text-sm text-gray-400 mb-1">Avg. Daily Carbs</span>
        <span className="text-2xl font-bold text-blue-400">
          {isLoading ? "-" : `${averages.carbs}g`}
        </span>
      </div>
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
        <span className="text-sm text-gray-400 mb-1">Avg. Daily Fats</span>
        <span className="text-2xl font-bold text-red-400">
          {isLoading ? "-" : `${averages.fats}g`}
        </span>
      </div>
    </div>
  );
}

interface EnhancedInsightsProps {
  aggregatedData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  averages: { calories: number; protein: number; carbs: number; fats: number };
  isLoading: boolean;
}

function EnhancedInsights({
  aggregatedData,
  averages,
  isLoading,
}: EnhancedInsightsProps) {
  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 h-40 flex items-center justify-center text-gray-400 text-center">
      Enhanced Insights (Coming Soon)
    </div>
  );
}

export default EnhancedInsights;

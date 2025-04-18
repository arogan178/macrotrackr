interface MealTimeBreakdownProps {
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
}

function MealTimeBreakdown({ data }: MealTimeBreakdownProps) {
  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 h-40 flex items-center justify-center text-gray-400 text-center">
      Meal Time Breakdown (Coming Soon)
    </div>
  );
}

export default MealTimeBreakdown;

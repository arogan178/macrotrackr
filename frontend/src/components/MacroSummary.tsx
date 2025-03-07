import { MacroTotals } from "../types";

interface MacroSummaryProps {
  totals: MacroTotals;
}

export default function MacroSummary({ totals }: MacroSummaryProps) {
  const totalCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
  const proteinPercent = totalCalories ? Math.round((totals.protein * 4 / totalCalories) * 100) : 0;
  const carbsPercent = totalCalories ? Math.round((totals.carbs * 4 / totalCalories) * 100) : 0;
  const fatsPercent = totalCalories ? Math.round((totals.fats * 9 / totalCalories) * 100) : 0;

  const macroData = [
    {
      name: "Protein",
      grams: totals.protein,
      calories: totals.protein * 4,
      percent: proteinPercent,
      color: "bg-green-500",
      textColor: "text-green-400",
      borderColor: "border-green-500/20",
      gradientFrom: "from-green-900/30",
      barColor: "bg-green-500/80"
    },
    {
      name: "Carbs",
      grams: totals.carbs,
      calories: totals.carbs * 4,
      percent: carbsPercent,
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      gradientFrom: "from-blue-900/30",
      barColor: "bg-blue-500/80"
    },
    {
      name: "Fats",
      grams: totals.fats,
      calories: totals.fats * 9,
      percent: fatsPercent,
      color: "bg-red-500",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      gradientFrom: "from-red-900/30",
      barColor: "bg-red-500/80"
    }
  ];

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-200">Today's Summary</h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">{totalCalories}</div>
              <div className="text-xs text-gray-400">Total kcal</div>
            </div>
          </div>

          {/* Stacked bar for overall macro split */}
          <div className="h-2 w-full bg-gray-700/30 rounded-full overflow-hidden flex">
            <div className="h-full bg-green-500/80 transition-all duration-500"
                 style={{ width: `${proteinPercent}%` }}
            />
            <div className="h-full bg-blue-500/80 transition-all duration-500"
                 style={{ width: `${carbsPercent}%` }}
            />
            <div className="h-full bg-red-500/80 transition-all duration-500"
                 style={{ width: `${fatsPercent}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          {macroData.map((macro) => (
            <div key={macro.name} className={`bg-gradient-to-br ${macro.gradientFrom} to-gray-800/10 p-4 rounded-xl border ${macro.borderColor}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${macro.color}`}></div>
                  <h3 className={`${macro.textColor} text-sm font-medium`}>
                    {macro.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">{macro.grams}g</span>
                </div>
              </div>
              
              <div className="relative h-2 rounded-full bg-gray-700/50 overflow-hidden">
                <div 
                  className={`absolute left-0 top-0 h-full ${macro.barColor} transition-all duration-500`}
                  style={{ width: `${macro.percent}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${macro.textColor}`}>
                    {macro.calories} kcal
                  </span>
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <span>{macro.percent}% of daily calories</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
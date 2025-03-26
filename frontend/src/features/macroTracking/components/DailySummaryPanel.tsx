import { MacroTotals, MacroDistributionSettings } from "../types";

interface DailySummaryProps {
  totals: MacroTotals;
  macroDistribution?: MacroDistributionSettings;
}

export default function DailySummary({
  totals,
  macroDistribution,
}: DailySummaryProps) {
  const defaultDistribution = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };

  const distribution = macroDistribution || defaultDistribution;

  const totalCalories = Math.round(
    totals.protein * 4 + totals.carbs * 4 + totals.fats * 9
  );
  const proteinPercent = Math.round(
    totalCalories ? ((totals.protein * 4) / totalCalories) * 100 : 0
  );
  const carbsPercent = Math.round(
    totalCalories ? ((totals.carbs * 4) / totalCalories) * 100 : 0
  );
  const fatsPercent = Math.round(
    totalCalories ? ((totals.fats * 9) / totalCalories) * 100 : 0
  );

  const macroData = [
    {
      name: "Protein",
      grams: (totals.protein || 0).toFixed(1),
      calories: Math.round(totals.protein * 4),
      percent: proteinPercent,
      targetPercent: distribution.proteinPercentage,
      color: "bg-green-500",
      textColor: "text-green-400",
      borderColor: "border-green-500/20",
      gradientFrom: "from-green-900/30",
      barColor: "bg-green-500/80",
      targetBarColor: "bg-green-700/30",
    },
    {
      name: "Carbs",
      grams: (totals.carbs || 0).toFixed(1),
      calories: Math.round(totals.carbs * 4),
      percent: carbsPercent,
      targetPercent: distribution.carbsPercentage,
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/20",
      gradientFrom: "from-blue-900/30",
      barColor: "bg-blue-500/80",
      targetBarColor: "bg-blue-700/30",
    },
    {
      name: "Fats",
      grams: (totals.fats || 0).toFixed(1),
      calories: Math.round(totals.fats * 9),
      percent: fatsPercent,
      targetPercent: distribution.fatsPercentage,
      color: "bg-red-500",
      textColor: "text-red-400",
      borderColor: "border-red-500/20",
      gradientFrom: "from-red-900/30",
      barColor: "bg-red-500/80",
      targetBarColor: "bg-red-700/30",
    },
  ];

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-gray-200">
              Today's Summary
            </h2>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">
                {totalCalories}
              </div>
              <div className="text-xs text-gray-400">Total kcal</div>
            </div>
          </div>

          {/* Stacked bar for overall macro split */}
          <div className="relative h-2 w-full bg-gray-700/30 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-green-500/80 transition-all duration-500"
              style={{ width: `${proteinPercent}%` }}
            />
            <div
              className="absolute top-0 h-full bg-blue-500/80 transition-all duration-500"
              style={{ width: `${carbsPercent}%`, left: `${proteinPercent}%` }}
            />
            <div
              className="absolute top-0 h-full bg-red-500/80 transition-all duration-500"
              style={{
                width: `${fatsPercent}%`,
                left: `${proteinPercent + carbsPercent}%`,
              }}
            />
          </div>

          {/* Current Percentages Legend */}
          <div className="flex mt-2 justify-between text-xs">
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              <span className="text-gray-400">{proteinPercent}%</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              <span className="text-gray-400">{carbsPercent}%</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-1"></span>
              <span className="text-gray-400">{fatsPercent}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {macroData.map((macro) => (
            <div
              key={macro.name}
              className={`bg-gradient-to-br ${macro.gradientFrom} to-gray-800/10 p-4 rounded-xl border ${macro.borderColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${macro.color}`}></div>
                  <h3 className={`${macro.textColor} text-sm font-medium`}>
                    {macro.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-white">
                    {macro.grams}g
                  </span>
                </div>
              </div>

              <div className="relative h-2 rounded-full bg-gray-700/50 overflow-hidden">
                {/* Target percentage background bar */}
                <div
                  className={`absolute left-0 top-0 h-full ${macro.targetBarColor} transition-all duration-500`}
                  style={{ width: `${macro.targetPercent}%` }}
                ></div>
                {/* Actual percentage bar */}
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
                <div className="flex items-center text-xs">
                  <span className="text-gray-400">{macro.percent}% </span>
                  <span className="text-gray-500 mx-1">•</span>
                  <span className="text-gray-600">
                    Target: {macro.targetPercent}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

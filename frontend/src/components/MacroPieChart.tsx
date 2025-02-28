import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      name: string;
      value: number;
      percentage: number;
      grams: number;
    };
  }>;
}

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6"]; // Red (protein), Yellow (carbs), Blue (fats)
const HOVER_COLORS = ["#dc2626", "#d97706", "#2563eb"]; // Darker versions for hover effect

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-700">
        <p className="font-medium text-base">{data.name}</p>
        <p className="text-sm">
          <span className="text-gray-400">Calories: </span>
          <span className="font-medium text-white">{data.value} kcal</span>
        </p>
        <p className="text-sm">
          <span className="text-gray-400">Amount: </span>
          <span className="font-medium text-white">{data.grams}g</span>
        </p>
        <p className="text-sm">
          <span className="text-gray-400">Percentage: </span>
          <span className="font-medium text-white">{data.percentage}%</span>
        </p>
      </div>
    );
  }

  return null;
};

export default function MacroPieChart({ totals }: { totals: MacroTotals }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Calculate caloric values
  const proteinCals = totals.protein * 4;
  const carbsCals = totals.carbs * 4;
  const fatsCals = totals.fats * 9;
  const totalCals = proteinCals + carbsCals + fatsCals;
  
  // Calculate percentages
  const proteinPct = totalCals > 0 ? Math.round((proteinCals / totalCals) * 100) : 0;
  const carbsPct = totalCals > 0 ? Math.round((carbsCals / totalCals) * 100) : 0;
  const fatsPct = totalCals > 0 ? Math.round((fatsCals / totalCals) * 100) : 0;

  const data = [
    { name: "Protein", value: proteinCals, percentage: proteinPct, grams: totals.protein },
    { name: "Carbs", value: carbsCals, percentage: carbsPct, grams: totals.carbs },
    { name: "Fats", value: fatsCals, percentage: fatsPct, grams: totals.fats },
  ];

  // If there's no data, show placeholder
  if (totalCals === 0) {
    return (
      <div className="h-64 mt-8 flex items-center justify-center flex-col">
        <div className="text-gray-500 mb-4">No data to display</div>
        <div className="w-32 h-32 rounded-full border-4 border-dashed border-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
        </div>
      </div>
    );
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  const renderLegend = () => (
    <div className="flex justify-center gap-8 mt-6">
      {data.map((entry, index) => (
        <div 
          key={`legend-${index}`} 
          className="flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
          onMouseEnter={() => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(null)}
        >
          <div
            className="w-4 h-4 rounded-full shadow-md"
            style={{ 
              backgroundColor: activeIndex === index ? HOVER_COLORS[index] : COLORS[index],
              transition: 'background-color 0.2s ease-in-out'
            }}
          />
          <div>
            <div className="text-gray-300 font-medium">{entry.name}</div>
            <div className="text-gray-400 text-xs">{entry.percentage}% ({entry.grams}g)</div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-80 mt-6 animate-fade-in">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={activeIndex !== null ? 90 : 85}
            dataKey="value"
            strokeWidth={2}
            stroke="#1f2937"
            onMouseEnter={onPieEnter}
            onMouseLeave={onPieLeave}
            animationDuration={800}
            animationBegin={0}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={activeIndex === index ? HOVER_COLORS[index] : COLORS[index]}
                className="transition-all duration-300"
                style={{ filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' : 'none' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
}

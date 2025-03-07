import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useEffect } from "react";

interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

interface ChartData {
  name: string;
  value: number;
  calories: number;
}

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
  }>;
}

const COLORS = ["#22c55e", "#3b82f6", "#ef4444"];
const RADIAN = Math.PI / 180;

// Custom label for the pie chart
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: CustomLabelProps) => {
  if (percent < 0.05) return null;
  
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text 
      x={x} 
      y={y} 
      fill="white"
      filter="drop-shadow(0px 0px 2px rgba(0,0,0,0.5))"
      textAnchor="middle" 
      dominantBaseline="central"
      className="text-sm font-bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-gray-800/90 backdrop-blur-sm border border-gray-700/70 shadow-xl rounded-lg px-3 py-2">
        <p className="text-sm text-gray-300">{`${data.name}: ${data.value} kcal`}</p>
      </div>
    );
  }
  return null;
};

export default function MacroPieChart({ totals }: { totals: MacroTotals }) {
  const [animationFinished, setAnimationFinished] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const data: ChartData[] = [
      { name: "Protein", value: totals.protein * 4, calories: totals.protein * 4 },
      { name: "Carbs", value: totals.carbs * 4, calories: totals.carbs * 4 },
      { name: "Fats", value: totals.fats * 9, calories: totals.fats * 9 },
    ];
    setChartData(data);
  }, [totals]);

  const totalCalories = totals.protein * 4 + totals.carbs * 4 + totals.fats * 9;
  const proteinPercent = totalCalories ? Math.round((totals.protein * 4 / totalCalories) * 100) : 0;
  const carbsPercent = totalCalories ? Math.round((totals.carbs * 4 / totalCalories) * 100) : 0;
  const fatsPercent = totalCalories ? Math.round((totals.fats * 9 / totalCalories) * 100) : 0;

  return (
    <div className="relative">
      {animationFinished && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10 pointer-events-none bg-gray-800/50 backdrop-blur-sm rounded-full p-2">
          <div className="text-xl font-bold text-white">{totalCalories}</div>
          <div className="text-xs text-gray-300">kcal</div>
        </div>
      )}

      <div className="h-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
              strokeWidth={1}
              stroke="#1f2937"
              onAnimationEnd={() => setAnimationFinished(true)}
              labelLine={false}
              label={renderCustomizedLabel}
              animationBegin={0}
              animationDuration={1500}
              isAnimationActive={true}
            >
              {chartData.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  className="opacity-90 hover:opacity-100 transition-opacity"
                  style={{ filter: 'drop-shadow(0px 0px 3px rgba(0, 0, 0, 0.3))' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

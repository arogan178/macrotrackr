import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

const COLORS = ["#22c55e", "#3b82f6", "#ef4444"]; // Vibrant green, blue, red

export default function MacroPieChart({ totals }: { totals: MacroTotals }) {
  const data = [
    { name: "Protein", value: totals.protein * 4 },
    { name: "Carbs", value: totals.carbs * 4 },
    { name: "Fats", value: totals.fats * 9 },
  ];

  return (
    <div className="h-64 mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            dataKey="value"
            strokeWidth={2}
            stroke="#1f2937"
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-6">
        {["Protein", "Carbs", "Fats"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span className="text-gray-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

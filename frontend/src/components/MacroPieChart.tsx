import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

const COLORS = ["#22c55e", "#3b82f6", "#ef4444"]; // Green, Blue, Red

export default function MacroPieChart({ totals }: { totals: MacroTotals }) {
  const data = [
    { name: "Protein", value: totals.protein * 4 }, // Calories from protein
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
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
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

      <div className="flex justify-center gap-4 mt-4">
        {["Protein", "Carbs", "Fats"].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index] }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

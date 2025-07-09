import { TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

// Default Tooltip for LineChartComponent
export function DefaultTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-700/50 rounded-lg p-3 shadow-lg text-sm">
        <p className="label text-gray-200 font-semibold mb-1">{label}</p>
        {payload.map((entry) => (
          <p
            key={`tooltip-${entry.dataKey}`}
            className="intro"
            style={{ color: entry.color || entry.stroke }}
          >
            {`${entry.name || entry.dataKey}: ${
              entry.value?.toLocaleString() ?? "N/A"
            }`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Chart element generator helpers (e.g., gradients, reference lines)
// Example: Gradient generator for line charts
export function createLinearGradient(id: string, from: string, to: string) {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor={from} stopOpacity={0.8} />
      <stop offset="100%" stopColor={to} stopOpacity={0.2} />
    </linearGradient>
  );
}

// Example: Reference line generator
export function createReferenceLine({
  y,
  label,
  color = "#8884d8",
}: {
  y: number;
  label?: string;
  color?: string;
}) {
  return {
    y,
    stroke: color,
    strokeDasharray: "3 3",
    label: label
      ? { value: label, position: "right", fill: color, fontSize: 12 }
      : undefined,
  };
}

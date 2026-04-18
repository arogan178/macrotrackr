import { format, isValid,parseISO } from "date-fns";

interface WeightLogEntry {
  id: string;
  timestamp: string;
  weight: number;
}

export interface ChartData {
  name: string;
  weight: number;
  fullDate: string;
  id: string;
}

export function groupWeightLogByDate(weightLog: WeightLogEntry[]): ChartData[] {
  const log = Array.isArray(weightLog) ? weightLog : [];

  const grouped: Record<
    string,
    { weights: number[]; ids: string[]; timestamps: string[] }
  > = {};
  
  for (const entry of log) {
    if (!entry.timestamp || !isValid(parseISO(entry.timestamp))) continue;
    const dateKey = format(parseISO(entry.timestamp), "yyyy-MM-dd");
    if (!grouped[dateKey])
      grouped[dateKey] = { weights: [], ids: [], timestamps: [] };
    grouped[dateKey].weights.push(entry.weight);
    grouped[dateKey].ids.push(entry.id);
    grouped[dateKey].timestamps.push(entry.timestamp);
  }

  return Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([dateKey, { weights, ids, timestamps }]) => {
      const avgWeight =
        weights.reduce((sum, w) => sum + w, 0) / (weights.length || 1);
      const sortedTimestamps = [...timestamps].sort(
        (a, b) => parseISO(a).getTime() - parseISO(b).getTime(),
      );

      return {
        name: format(parseISO(dateKey), "MMM d"),
        weight: avgWeight,
        fullDate: sortedTimestamps[0],
        id: ids[0],
      };
    });
}

import { format, parseISO } from "date-fns";

import type { WeightLogEntry } from "@/api/goals";
import type { HabitGoalPayload } from "@/api/habits";
import { escapeCsvValue } from "@/features/macroTracking/utils/historyExport";

function toCsv(headers: string[], rows: (string | number | undefined)[][]) {
  return [
    headers.join(","),
    ...rows.map((row) => row.map((value) => escapeCsvValue(value)).join(",")),
  ].join("\n");
}

// "Date" and "Weight (kg)" are the headers the importer reads back.
export function buildWeightLogCsv(entries: WeightLogEntry[]) {
  return toCsv(
    ["Date", "Weight (kg)"],
    entries.map((entry) => [
      format(parseISO(entry.timestamp), "yyyy-MM-dd"),
      entry.weight,
    ]),
  );
}

export function buildHabitsCsv(habits: HabitGoalPayload[]) {
  return toCsv(
    ["Name", "Current", "Target", "Complete", "Created At", "Completed At"],
    habits.map((habit) => [
      habit.title,
      habit.current,
      habit.target,
      habit.isComplete ? "yes" : "no",
      habit.createdAt,
      habit.completedAt,
    ]),
  );
}

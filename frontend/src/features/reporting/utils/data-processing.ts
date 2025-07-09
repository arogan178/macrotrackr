import { MacroEntry } from "@/types/macro";
import { isWithinDateRange } from "./date-utils";
import { calculateDailyTotals } from "./macro-calculations";

// Data processing types
interface GroupedData {
  [date: string]: MacroEntry[];
}

interface DailyData {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  entries: MacroEntry[];
}

interface MealTypeData {
  [mealType: string]: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    count: number;
  };
}

// Data filtering utilities
export const filterEntriesByDateRange = (
  entries: MacroEntry[],
  startDate: string,
  endDate: string,
): MacroEntry[] => {
  return entries.filter((entry) =>
    isWithinDateRange(entry.entryDate, startDate, endDate),
  );
};

export const filterEntriesByMealType = (
  entries: MacroEntry[],
  mealType: string,
): MacroEntry[] => {
  return entries.filter((entry) => entry.mealType === mealType);
};

// Data grouping utilities
export const groupEntriesByDate = (entries: MacroEntry[]): GroupedData => {
  return entries.reduce((groups: GroupedData, entry) => {
    const date = entry.entryDate;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(entry);
    return groups;
  }, {});
};

export const groupEntriesByMealType = (entries: MacroEntry[]): MealTypeData => {
  return entries.reduce((groups: MealTypeData, entry) => {
    const mealType = entry.mealType;
    if (!groups[mealType]) {
      groups[mealType] = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        count: 0,
      };
    }

    const dailyTotals = calculateDailyTotals([entry]);
    groups[mealType].calories += dailyTotals.calories;
    groups[mealType].protein += dailyTotals.protein;
    groups[mealType].carbs += dailyTotals.carbs;
    groups[mealType].fats += dailyTotals.fats;
    groups[mealType].count += 1;

    return groups;
  }, {});
};

// Data aggregation utilities
export const aggregateEntriesByDate = (entries: MacroEntry[]): DailyData[] => {
  const grouped = groupEntriesByDate(entries);

  return Object.entries(grouped)
    .map(([date, dateEntries]) => {
      const totals = calculateDailyTotals(dateEntries);
      return {
        date,
        ...totals,
        entries: dateEntries,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const calculateAveragesByMealType = (
  entries: MacroEntry[],
): MealTypeData => {
  const grouped = groupEntriesByMealType(entries);

  // Convert totals to averages
  Object.keys(grouped).forEach((mealType) => {
    const group = grouped[mealType];
    if (group.count > 0) {
      group.calories = Math.round(group.calories / group.count);
      group.protein = Math.round(group.protein / group.count);
      group.carbs = Math.round(group.carbs / group.count);
      group.fats = Math.round(group.fats / group.count);
    }
  });

  return grouped;
};

// Data transformation utilities
export const transformToChartData = (
  dailyData: DailyData[],
  metric: keyof Omit<DailyData, "date" | "entries">,
) => {
  return dailyData.map((day) => ({
    date: day.date,
    value: day[metric],
  }));
};

export const calculateDailyAverages = (dailyData: DailyData[]) => {
  if (dailyData.length === 0) {
    return { calories: 0, protein: 0, carbs: 0, fats: 0 };
  }

  const totals = dailyData.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fats: acc.fats + day.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );

  const days = dailyData.length;
  return {
    calories: Math.round(totals.calories / days),
    protein: Math.round(totals.protein / days),
    carbs: Math.round(totals.carbs / days),
    fats: Math.round(totals.fats / days),
  };
};

// Data quality utilities
export const calculateCompletionRate = (
  actualDays: number,
  expectedDays: number,
): number => {
  if (expectedDays === 0) return 0;
  return Math.round((actualDays / expectedDays) * 100);
};

export const getUniqueLoggedDates = (entries: MacroEntry[]): string[] => {
  const uniqueDates = new Set(entries.map((entry) => entry.entryDate));
  return Array.from(uniqueDates).sort();
};

export const getMissingDates = (
  loggedDates: string[],
  expectedDates: string[],
): string[] => {
  const loggedSet = new Set(loggedDates);
  return expectedDates.filter((date) => !loggedSet.has(date));
};

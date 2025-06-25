// Habit progress calculation utilities
export const calculateProgress = (current: number, target: number): number => {
  if (target <= 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
};

export const isHabitComplete = (current: number, target: number): boolean => {
  return current >= target;
};

export const calculateRemainingToTarget = (
  current: number,
  target: number
): number => {
  return Math.max(0, target - current);
};

export const calculateCompletionRate = (
  habits: Array<{ current: number; target: number }>
): number => {
  if (habits.length === 0) return 0;

  const completedHabits = habits.filter((habit) =>
    isHabitComplete(habit.current, habit.target)
  );
  return Math.round((completedHabits.length / habits.length) * 100);
};

export const calculateStreakDays = (
  completedDates: string[],
  referenceDate: string = new Date().toISOString().split("T")[0]
): number => {
  if (completedDates.length === 0) return 0;

  const sortedDates = completedDates
    .map((date) => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());

  const today = new Date(referenceDate);
  let streak = 0;
  let currentDate = new Date(today);

  for (const completedDate of sortedDates) {
    const daysDiff = Math.floor(
      (currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff === 0 || daysDiff === 1) {
      streak++;
      currentDate = new Date(completedDate);
    } else {
      break;
    }
  }

  return streak;
};

export const getHabitProgressColor = (progress: number): string => {
  if (progress >= 100) return "text-green-400";
  if (progress >= 75) return "text-blue-400";
  if (progress >= 50) return "text-yellow-400";
  return "text-gray-400";
};

export const getProgressBarColor = (
  progress: number
): "green" | "blue" | "yellow" | "gray" => {
  if (progress >= 100) return "green";
  if (progress >= 75) return "blue";
  if (progress >= 50) return "yellow";
  return "gray";
};

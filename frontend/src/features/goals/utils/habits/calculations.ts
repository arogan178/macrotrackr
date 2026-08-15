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
  target: number,
): number => {
  return Math.max(0, target - current);
};

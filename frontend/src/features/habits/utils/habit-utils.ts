import { HabitGoal, HabitGoalFormValues } from "../types/types";
import { generateId } from "@/utils/id-generator";
import { calculateProgress, isHabitComplete } from "./calculations";
import { DEFAULT_HABIT_COLOR } from "../constants";

// Habit creation utilities
export const createNewHabit = (values: HabitGoalFormValues): HabitGoal => {
  const current = 0;
  const progress = calculateProgress(current, values.target);

  return {
    id: generateId(),
    title: values.title,
    iconName: values.iconName,
    current,
    target: values.target,
    progress,
    accentColor: values.accentColor || DEFAULT_HABIT_COLOR,
    isComplete: isHabitComplete(current, values.target),
    createdAt: new Date().toISOString(),
  };
};

export const updateHabitFromForm = (
  existingHabit: HabitGoal,
  values: HabitGoalFormValues,
): HabitGoal => {
  const progress = calculateProgress(existingHabit.current, values.target);

  return {
    ...existingHabit,
    title: values.title,
    iconName: values.iconName,
    target: values.target,
    progress,
    accentColor:
      values.accentColor || existingHabit.accentColor || DEFAULT_HABIT_COLOR,
    isComplete: isHabitComplete(existingHabit.current, values.target),
  };
};

// Habit progress utilities
export const incrementHabitProgress = (
  habit: HabitGoal,
  incrementBy: number = 1,
): HabitGoal => {
  const newCurrent = habit.current + incrementBy;
  const newProgress = calculateProgress(newCurrent, habit.target);
  const wasComplete = habit.isComplete;
  const isNowComplete = isHabitComplete(newCurrent, habit.target);

  return {
    ...habit,
    current: newCurrent,
    progress: newProgress,
    isComplete: isNowComplete,
    completedAt:
      !wasComplete && isNowComplete
        ? new Date().toISOString()
        : habit.completedAt,
  };
};

export const completeHabit = (habit: HabitGoal): HabitGoal => {
  if (habit.isComplete) return habit;

  return {
    ...habit,
    current: habit.target,
    progress: 100,
    isComplete: true,
    completedAt: new Date().toISOString(),
  };
};

export const resetHabitProgress = (habit: HabitGoal): HabitGoal => {
  return {
    ...habit,
    current: 0,
    progress: 0,
    isComplete: false,
    completedAt: undefined,
  };
};

// Habit filtering and sorting utilities
export const filterHabitsByCompletion = (
  habits: HabitGoal[],
  showCompleted: boolean = true,
): HabitGoal[] => {
  if (showCompleted) return habits;
  return habits.filter((habit) => !habit.isComplete);
};

export const sortHabitsByProgress = (habits: HabitGoal[]): HabitGoal[] => {
  return [...habits].sort((a, b) => {
    // Completed habits go to the end
    if (a.isComplete && !b.isComplete) return 1;
    if (!a.isComplete && b.isComplete) return -1;

    // Sort by progress descending
    return b.progress - a.progress;
  });
};

export const sortHabitsByCreatedDate = (habits: HabitGoal[]): HabitGoal[] => {
  return [...habits].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

// Habit validation utilities
export const validateHabitForm = (values: HabitGoalFormValues): string[] => {
  const errors: string[] = [];

  if (!values.title?.trim()) {
    errors.push("Title is required");
  } else if (values.title.length > 100) {
    errors.push("Title must be less than 100 characters");
  }

  if (!values.target || values.target < 1) {
    errors.push("Target must be at least 1");
  } else if (values.target > 1000) {
    errors.push("Target must be less than 1000");
  }

  if (!values.iconName) {
    errors.push("Icon is required");
  }

  return errors;
};

export const isValidHabitForm = (values: HabitGoalFormValues): boolean => {
  return validateHabitForm(values).length === 0;
};

// Habit search and filtering utilities
export const searchHabits = (
  habits: HabitGoal[],
  searchTerm: string,
): HabitGoal[] => {
  if (!searchTerm.trim()) return habits;

  const term = searchTerm.toLowerCase();
  return habits.filter((habit) => habit.title.toLowerCase().includes(term));
};

export const getHabitsStats = (habits: HabitGoal[]) => {
  const total = habits.length;
  const completed = habits.filter((h) => h.isComplete).length;
  const inProgress = total - completed;
  const totalProgress = habits.reduce((sum, h) => sum + h.current, 0);
  const totalTarget = habits.reduce((sum, h) => sum + h.target, 0);
  const overallProgress =
    totalTarget > 0 ? Math.round((totalProgress / totalTarget) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    overallProgress,
    totalProgress,
    totalTarget,
  };
};

// Habit-related shared constants
// Usage example:
// import { HABIT_COLORS, HABIT_VALIDATION } from '@/utils/constants/habit';

export const HABIT_COLORS = {
  indigo: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    button: "bg-primary hover:bg-primary ",
    gradient: "from-primary to-primary",
  },
  blue: {
    bg: "bg-primary/10",
    border: "border-primary/20",
    text: "text-primary",
    button: "bg-primary hover:bg-primary ",
    gradient: "from-primary to-primary",
  },
  green: {
    bg: "bg-success/10",
    border: "border-green-500/20",
    text: "text-success",
    button: "bg-success hover:bg-success ",
    gradient: "from-green-500 to-green-600",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    button: "bg-purple-500 hover:bg-purple-600 ",
    gradient: "from-purple-500 to-purple-600",
  },
} as const;

export const HABIT_VALIDATION = {
  title: {
    minLength: 1,
    maxLength: 100,
  },
  target: {
    min: 1,
    max: 1000,
  },
} as const;

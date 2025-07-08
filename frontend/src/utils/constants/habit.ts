// Habit-related shared constants
// Usage example:
// import { HABIT_COLORS, HABIT_VALIDATION } from '@/utils/constants/habit';

export const HABIT_COLORS = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    button: "bg-indigo-500 hover:bg-indigo-600 ",
    gradient: "from-indigo-500 to-indigo-600",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    button: "bg-blue-500 hover:bg-blue-600 ",
    gradient: "from-blue-500 to-blue-600",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    button: "bg-green-500 hover:bg-green-600 ",
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

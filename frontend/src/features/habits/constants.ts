import type { ComponentType, SVGProps } from "react";

import {
  AwardIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  CoffeeIcon,
  DropletIcon,
  DumbBellIcon,
  HeartIcon,
  MoonIcon,
  SunIcon,
  TargetIcon,
} from "@/components/ui";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

// Habit icon mapping
export const HABIT_ICONS: Record<string, IconComponent> = {
  calendar: CalendarIcon,
  "check-circle": CheckCircleIcon,
  target: TargetIcon,
  award: AwardIcon,
  heart: HeartIcon,
  book: BookIcon,
  coffee: CoffeeIcon,
  droplet: DropletIcon,
  dumbbell: DumbBellIcon,
  moon: MoonIcon,
  sun: SunIcon,
} as const;

export type HabitIconName = keyof typeof HABIT_ICONS;

// Habit accent colors
export const HABIT_COLORS = {
  indigo: {
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    button: "bg-indigo-500 hover:bg-indigo-600",
    gradient: "from-indigo-500 to-indigo-600",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    button: "bg-blue-500 hover:bg-blue-600",
    gradient: "from-blue-500 to-blue-600",
  },
  green: {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    button: "bg-green-500 hover:bg-green-600",
    gradient: "from-green-500 to-green-600",
  },
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    button: "bg-purple-500 hover:bg-purple-600",
    gradient: "from-purple-500 to-purple-600",
  },
} as const;

export type HabitAccentColor = keyof typeof HABIT_COLORS;

// Default values and options
export const DEFAULT_HABIT_COLOR: HabitAccentColor = "indigo";
export const DEFAULT_HABIT_ICON: HabitIconName = "target";

export const HABIT_COLOR_OPTIONS = [
  { value: "indigo" as const, label: "Indigo", color: "bg-indigo-500" },
  { value: "blue" as const, label: "Blue", color: "bg-blue-500" },
  { value: "green" as const, label: "Green", color: "bg-green-500" },
  { value: "purple" as const, label: "Purple", color: "bg-purple-500" },
] as const;

export const HABIT_ICON_OPTIONS: Array<{
  value: HabitIconName;
  label: string;
  icon: IconComponent;
}> = [
  { value: "target" as const, label: "Target", icon: TargetIcon },
  { value: "calendar" as const, label: "Calendar", icon: CalendarIcon },
  {
    value: "check-circle" as const,
    label: "Check Circle",
    icon: CheckCircleIcon,
  },
  { value: "award" as const, label: "Award", icon: AwardIcon },
  { value: "heart" as const, label: "Heart", icon: HeartIcon },
  { value: "book" as const, label: "Book", icon: BookIcon },
  { value: "coffee" as const, label: "Coffee", icon: CoffeeIcon },
  { value: "droplet" as const, label: "Water", icon: DropletIcon },
  { value: "dumbbell" as const, label: "Exercise", icon: DumbBellIcon },
  { value: "moon" as const, label: "Sleep", icon: MoonIcon },
  { value: "sun" as const, label: "Morning", icon: SunIcon },
] as const;

// Validation constants
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

// Animation delays for staggered animations
export const ANIMATION_DELAYS = {
  card: 0.1,
  action: 0.05,
  progress: 0.2,
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  created: "Habit created successfully!",
  updated: "Habit updated successfully!",
  deleted: "Habit deleted successfully!",
  completed: "Congratulations! Habit completed!",
  progress: "Progress updated!",
  reset: "Habits reset successfully!",
} as const;

// Error messages
export const ERROR_MESSAGES = {
  create: "Failed to create habit",
  update: "Failed to update habit",
  delete: "Failed to delete habit",
  complete: "Failed to complete habit",
  progress: "Failed to update progress",
  fetch: "Failed to load habits",
  reset: "Failed to reset habits",
  validation: "Please check your input and try again",
} as const;

/**
 * Shared habit types used across features
 */

export type HabitAccentColor =
  | "indigo"
  | "blue"
  | "cyan"
  | "teal"
  | "green"
  | "lime"
  | "yellow"
  | "orange"
  | "red"
  | "pink"
  | "purple";

export interface HabitGoal {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?: HabitAccentColor;
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface HabitsState {
  habits: HabitGoal[];
  isLoading: boolean;
  error: string | undefined;
}

// Form values for creating/updating a habit goal
export interface HabitGoalFormValues {
  title: string;
  iconName: string;
  target: number;
  accentColor?: HabitAccentColor;
}

export interface HabitCardProps {
  habit: HabitGoal;
  onIncrement?: (id: string) => Promise<void>;
  onComplete?: (id: string) => Promise<void>;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
}

export interface HabitTrackerProps {
  habits: HabitGoal[];
  isLoading?: boolean;
  onAddHabit?: () => void;
  onIncrementHabit?: (id: string) => Promise<void>;
  onCompleteHabit?: (id: string) => Promise<void>;
  onEditHabit?: (id: string) => void;
  onDeleteHabit?: (id: string) => Promise<void>;
}

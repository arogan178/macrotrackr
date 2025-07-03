export interface HabitGoal {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?: "indigo" | "blue" | "green" | "purple"; // Consider using HabitAccentColor from shared constants if reused
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface HabitsState {
  habits: HabitGoal[];
  isLoading: boolean;
  error: string | null;
}

// Form values for creating/updating a habit goal
export interface HabitGoalFormValues {
  title: string;
  iconName: string;
  target: number;
  accentColor?: "indigo" | "blue" | "green" | "purple";
}

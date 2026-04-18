import { describe, expect, it } from "vitest";

import type { HabitAccentColor, HabitGoal, HabitsState } from "./habit";

describe("habit types", () => {
  it("HabitGoal has required properties", () => {
    const habit: HabitGoal = {
      id: "1",
      title: "Test",
      iconName: "icon",
      current: 1,
      target: 5,
      progress: 20,
      createdAt: "2024-01-01",
    };
    expect(habit.id).toBe("1");
    expect(habit.title).toBe("Test");
  });

  it("HabitsState has required properties", () => {
    const state: HabitsState = {
      habits: [],
      isLoading: false,
      error: undefined,
    };
    expect(state.habits).toEqual([]);
  });

  it("HabitAccentColor accepts valid values", () => {
    const colors: HabitAccentColor[] = ["red", "blue", "green"];
    expect(colors).toHaveLength(3);
  });
});

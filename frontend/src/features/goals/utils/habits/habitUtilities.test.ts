import { describe, expect, it } from "vitest";

import {
  buildHabitUpdatePayload,
  createNewHabit,
  filterHabitsByCompletion,
  incrementHabitProgress,
  sortHabitsByProgress,
  updateHabitFromForm,
} from "./habitUtilities";

describe("habitUtilities", () => {
  describe("buildHabitUpdatePayload", () => {
    it("builds update payload correctly", () => {
      const existing = { createdAt: "2024-01-01" } as any;
      const updated = {
        title: "Exercise",
        iconName: "dumbbell",
        current: 5,
        target: 10,
        accentColor: "#ff0000",
        isComplete: false,
        completedAt: undefined,
      };
      const payload = buildHabitUpdatePayload(existing, updated);
      expect(payload.title).toBe("Exercise");
      expect(payload.createdAt).toBe("2024-01-01");
    });
  });

  describe("createNewHabit", () => {
    it("creates habit with generated id", () => {
      const habit = createNewHabit({ title: "Exercise", target: 10 });
      expect(habit.id).toBeDefined();
      expect(habit.title).toBe("Exercise");
      expect(habit.target).toBe(10);
      expect(habit.current).toBe(0);
    });

    it("uses default color when not provided", () => {
      const habit = createNewHabit({ title: "Exercise", target: 10 });
      expect(habit.accentColor).toBeDefined();
    });
  });

  describe("updateHabitFromForm", () => {
    const habit = {
      id: "h1",
      title: "Run",
      iconName: "dumbbell",
      current: 2,
      target: 3,
      progress: 67,
      createdAt: "2026-09-01T08:00:00.000Z",
    };
    const values = { title: "Run", iconName: "dumbbell", target: 3 };

    it("keeps progress when the frequency stays the same", () => {
      expect(updateHabitFromForm(habit, { ...values, frequency: "daily" })).toMatchObject({
        current: 2,
        frequency: "daily",
      });
    });

    it("starts from 0 when the frequency changes", () => {
      expect(updateHabitFromForm(habit, { ...values, frequency: "weekly" })).toMatchObject({
        current: 0,
        progress: 0,
        frequency: "weekly",
      });
    });
  });

  describe("incrementHabitProgress", () => {
    const habit = {
      id: "h1",
      title: "Water, 2L",
      iconName: "droplet",
      current: 8,
      target: 8,
      progress: 100,
      isComplete: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      completedAt: "2026-09-25T10:00:00.000Z",
    };

    it("undoes completion when decremented", () => {
      expect(incrementHabitProgress(habit, -1)).toMatchObject({
        current: 7,
        isComplete: false,
        completedAt: undefined,
      });
    });

    it("stays within 0 and the target", () => {
      expect(incrementHabitProgress(habit).current).toBe(8);
      expect(
        incrementHabitProgress({ ...habit, current: 0, isComplete: false }, -1)
          .current,
      ).toBe(0);
    });
  });

  describe("filterHabitsByCompletion", () => {
    it("returns all habits when showCompleted is true", () => {
      const habits = [
        { isComplete: true },
        { isComplete: false },
      ] as any[];
      const filtered = filterHabitsByCompletion(habits, true);
      expect(filtered).toHaveLength(2);
    });

    it("filters out completed habits when showCompleted is false", () => {
      const habits = [
        { isComplete: true },
        { isComplete: false },
      ] as any[];
      const filtered = filterHabitsByCompletion(habits, false);
      expect(filtered).toHaveLength(1);
    });
  });

  describe("sortHabitsByProgress", () => {
    it("sorts by progress descending", () => {
      const habits = [
        { progress: 30 },
        { progress: 80 },
        { progress: 50 },
      ] as any[];
      const sorted = sortHabitsByProgress(habits);
      expect(sorted[0].progress).toBe(80);
      expect(sorted[2].progress).toBe(30);
    });
  });
});

import { describe, expect, it } from "vitest";

import type { MealType } from "@/types/macro";

import { nextReminderMeal, planReminders, reminderId } from "./reminderPlan";

// 22 Oct 2026, 11:00 local time.
const now = new Date(2026, 9, 22, 11, 0);
const none = new Set<MealType>();

describe("nextReminderMeal", () => {
  it("offers the next main meal after the one just logged", () => {
    expect(nextReminderMeal("breakfast", now)).toBe("lunch");
    expect(nextReminderMeal("lunch", now)).toBe("dinner");
    expect(nextReminderMeal("dinner", now)).toBe("breakfast");
  });

  it("picks the next meal by the clock after a snack", () => {
    expect(nextReminderMeal("snack", now)).toBe("lunch");
    expect(nextReminderMeal("snack", new Date(2026, 9, 22, 21, 0))).toBe("breakfast");
  });
});

describe("planReminders", () => {
  it("schedules a week ahead, starting today when the time is still to come", () => {
    const plan = planReminders({ lunch: "13:00" }, none, now);

    expect(plan).toHaveLength(7);
    expect(plan[0].at).toEqual(new Date(2026, 9, 22, 13, 0));
    expect(plan[6].at).toEqual(new Date(2026, 9, 28, 13, 0));
  });

  it("skips today's reminder once that meal is logged", () => {
    const plan = planReminders({ lunch: "13:00" }, new Set<MealType>(["lunch"]), now);

    expect(plan).toHaveLength(6);
    expect(plan[0].at).toEqual(new Date(2026, 9, 23, 13, 0));
  });

  it("skips a time that has already passed today", () => {
    const plan = planReminders({ breakfast: "08:30" }, none, now);

    expect(plan[0].at).toEqual(new Date(2026, 9, 23, 8, 30));
  });

  it("schedules nothing when every reminder is off", () => {
    expect(planReminders({}, none, now)).toEqual([]);
  });

  it("keeps one id per meal and day, so a reschedule replaces rather than duplicates", () => {
    const plan = planReminders({ breakfast: "08:30", lunch: "13:00", dinner: "19:30" }, none, now);
    const ids = plan.map((reminder) => reminder.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(reminderId("lunch", new Date(2026, 9, 22, 13, 0))).toBe(
      reminderId("lunch", new Date(2026, 9, 22, 18, 0)),
    );
    expect(Math.max(...ids)).toBeLessThan(2 ** 31);
  });
});

import { describe, expect, it } from "vitest";

import {
  type LoggedEntry,
  type MealReminder,
  missedDays,
  nextReminderMeal,
  planReminders,
  reminderId,
  reminderTime,
  streakDays,
  usualTime,
} from "./reminderPlan";

// Thursday 22 Oct 2026, 11:00 local time.
const now = new Date(2026, 9, 22, 11, 0);
const TODAY = "2026-10-22";
const auto = (since = "2026-10-01"): MealReminder => ({ time: "auto", since });
const lunchOn = (date: string, time = "12:40"): LoggedEntry => ({ entryDate: date, entryTime: time, mealType: "lunch" });
const days = (plan: { at: Date }[]) => plan.map(({ at }) => at.getDate());

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

describe("learning the time", () => {
  it("waits for three days of a meal before learning its time", () => {
    expect(usualTime("lunch", [lunchOn("2026-10-20"), lunchOn("2026-10-21")])).toBeUndefined();
  });

  it("takes the median of each day's first entry, ignoring a second helping", () => {
    const entries = [
      lunchOn("2026-10-19", "12:10"),
      lunchOn("2026-10-20", "12:40"),
      lunchOn("2026-10-20", "15:00"),
      lunchOn("2026-10-21", "13:30"),
    ];

    expect(usualTime("lunch", entries)).toBe("12:40");
  });

  it("aims half an hour early, since Android only ever delivers late", () => {
    const entries = ["2026-10-19", "2026-10-20", "2026-10-21"].map((date) => lunchOn(date));

    expect(reminderTime("lunch", auto(), entries)).toBe("12:10");
    expect(reminderTime("lunch", auto(), [])).toBe("13:00");
    expect(reminderTime("lunch", { time: "11:45", since: TODAY }, entries)).toBe("11:45");
  });
});

describe("counting", () => {
  it("counts days in a row without the meal, back to when reminders began", () => {
    const entries = [lunchOn("2026-10-18")];

    expect(missedDays("lunch", "2026-10-01", entries, TODAY)).toBe(3);
    expect(missedDays("lunch", "2026-10-20", entries, TODAY)).toBe(2);
  });

  it("counts a streak through today, or through yesterday when today is still empty", () => {
    const entries = [lunchOn("2026-10-20"), lunchOn("2026-10-21")];

    expect(streakDays(entries, TODAY)).toBe(2);
    expect(streakDays([...entries, lunchOn(TODAY)], TODAY)).toBe(3);
  });
});

describe("planReminders", () => {
  it("nudges daily while answered, then every other day, then once to say they are paused", () => {
    const plan = planReminders({ lunch: auto(TODAY) }, [], now);

    // Ignored 0, 1, 2 days: daily. 3 to 6: every other day. 7: the paused notice.
    expect(days(plan)).toEqual([22, 23, 24, 26, 28, 29]);
    expect(plan.at(-1)?.kind).toBe("paused");
    expect(plan.at(-1)?.title).toBe("Lunch reminders paused");
    expect(plan.filter(({ kind }) => kind === "paused")).toHaveLength(1);
  });

  it("starts the decay where it left off when the meal has been ignored already", () => {
    const plan = planReminders({ lunch: auto() }, [lunchOn("2026-10-17")], now);

    // Four days ignored: send at 4 and 6, the paused notice at 7, then nothing.
    expect(days(plan)).toEqual([22, 24, 25]);
    expect(plan[0].body).toBe("No lunch logged in 4 days.");
  });

  it("plans nothing once a week has gone by, and starts again when the meal is logged", () => {
    expect(planReminders({ lunch: auto() }, [lunchOn("2026-10-12")], now)).toEqual([]);

    const restarted = planReminders({ lunch: auto() }, [lunchOn("2026-10-12"), lunchOn(TODAY)], now);
    expect(days(restarted).slice(0, 3)).toEqual([23, 24, 25]);
  });

  it("skips today once the meal is logged, resets the count, and still ends on the paused notice", () => {
    const plan = planReminders({ lunch: auto() }, [lunchOn("2026-10-15"), lunchOn(TODAY, "10:30")], now);

    expect(plan[0].at.getDate()).toBe(23);
    expect(plan[0].kind).toBe("nudge");
    expect(plan.at(-1)?.kind).toBe("paused");
  });

  it("says the streak once, on the next reminder, and never undercounts a long one", () => {
    const week = Array.from({ length: 9 }, (_, index) => lunchOn(`2026-10-${String(14 + index).padStart(2, "0")}`));
    const plan = planReminders({ breakfast: auto(TODAY), lunch: auto(), dinner: auto(TODAY) }, week, now);

    expect(plan.filter(({ body }) => body.includes("row") || body.includes("every day"))).toHaveLength(1);
    expect(plan[0].body).toBe("Logged every day for over a week.");
  });

  it("states a fact in each nudge: the streak first, then the usual time", () => {
    const entries = ["2026-10-19", "2026-10-20", "2026-10-21"].map((date) => lunchOn(date));
    const plan = planReminders({ lunch: auto() }, entries, now);

    expect(plan[0].body).toBe("3 days logged in a row.");
    expect(plan[1].body).toBe("You usually log lunch around 12:40.");
    expect(plan[0].at).toEqual(new Date(2026, 9, 22, 12, 10));
  });

  it("sends someone drifting away one reminder a day, and one paused notice in all", () => {
    const plan = planReminders({ breakfast: auto(TODAY), lunch: auto(TODAY), dinner: auto(TODAY) }, [], now);
    const backingOff = plan.filter(({ kind, ignored }) => kind === "nudge" && ignored >= 3);
    const perDay = new Set(backingOff.map(({ at }) => at.toDateString()));

    expect(backingOff).toHaveLength(perDay.size);
    expect(plan.filter(({ kind }) => kind === "paused")).toHaveLength(1);
    expect(plan.at(-1)?.title).toBe("Meal reminders paused");
  });

  it("schedules nothing when every reminder is off", () => {
    expect(planReminders({}, [], now)).toEqual([]);
  });

  it("keeps one id per meal and day, so a reschedule replaces rather than duplicates", () => {
    const plan = planReminders({ breakfast: auto(TODAY), lunch: auto(TODAY), dinner: auto(TODAY) }, [], now);
    const ids = plan.map((reminder) => reminder.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(reminderId("lunch", new Date(2026, 9, 22, 13, 0))).toBe(reminderId("lunch", new Date(2026, 9, 22, 18, 0)));
    expect(Math.max(...ids)).toBeLessThan(2 ** 31);
  });
});

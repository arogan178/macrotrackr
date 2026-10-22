import type { MealType } from "@/types/macro";

export type ReminderMeal = Exclude<MealType, "snack">;

export const REMINDER_MEALS: readonly ReminderMeal[] = ["breakfast", "lunch", "dinner"];

export const DEFAULT_REMINDER_TIME: Record<ReminderMeal, string> = {
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "19:30",
};

/** A meal is on when it has a time, as "HH:mm" in the phone's local time. */
export type ReminderSettings = Partial<Record<ReminderMeal, string>>;

/**
 * How far ahead reminders are scheduled. They are topped up whenever the app
 * opens, so someone who stops opening it gets a week of them, not a lifetime.
 */
export const REMINDER_DAYS = 7;

export interface PlannedReminder {
  id: number;
  meal: ReminderMeal;
  at: Date;
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

/**
 * The meal to offer a reminder for, just after one was logged: the next main
 * meal of the day, or for a snack the next one by the clock.
 */
export function nextReminderMeal(logged: MealType, now: Date): ReminderMeal {
  if (logged === "breakfast") return "lunch";
  if (logged === "lunch") return "dinner";
  if (logged === "dinner") return "breakfast";

  const minutesNow = now.getHours() * 60 + now.getMinutes();

  return (
    REMINDER_MEALS.find((meal) => toMinutes(DEFAULT_REMINDER_TIME[meal]) > minutesNow) ??
    "breakfast"
  );
}

/** Stable per meal and day, so rescheduling replaces a reminder instead of adding a second. */
export function reminderId(meal: ReminderMeal, at: Date): number {
  return (
    (REMINDER_MEALS.indexOf(meal) + 1) * 100_000_000 +
    (at.getFullYear() - 2000) * 10_000 +
    (at.getMonth() + 1) * 100 +
    at.getDate()
  );
}

/**
 * Every reminder for the coming week. Today's is skipped for a meal already
 * logged, and so is any time that has passed.
 */
export function planReminders(
  settings: ReminderSettings,
  loggedToday: ReadonlySet<MealType>,
  now: Date,
  days = REMINDER_DAYS,
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];

  for (let day = 0; day < days; day++) {
    for (const meal of REMINDER_MEALS) {
      const time = settings[meal];
      if (!time || (day === 0 && loggedToday.has(meal))) continue;

      const [hours, minutes] = time.split(":").map(Number);
      const at = new Date(now);
      at.setDate(now.getDate() + day);
      at.setHours(hours, minutes, 0, 0);
      if (at <= now) continue;

      planned.push({ id: reminderId(meal, at), meal, at });
    }
  }

  return planned;
}

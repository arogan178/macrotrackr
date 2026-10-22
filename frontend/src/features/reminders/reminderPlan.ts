import type { MealType } from "@/types/macro";
import { addDaysISO, todayISO } from "@/utils/dateUtilities";

export type ReminderMeal = Exclude<MealType, "snack">;

export const REMINDER_MEALS: readonly ReminderMeal[] = ["breakfast", "lunch", "dinner"];

export const DEFAULT_REMINDER_TIME: Record<ReminderMeal, string> = {
  breakfast: "08:30",
  lunch: "13:00",
  dinner: "19:30",
};

/**
 * "auto" follows when the meal is usually logged; "HH:mm" is pinned by the
 * user. `since` is the day the reminder was turned on, so days before it never
 * count as ignored.
 */
export interface MealReminder {
  time: "auto" | string;
  since: string;
}

export type ReminderSettings = Partial<Record<ReminderMeal, MealReminder>>;

/** The entry fields the plan reads; the phone keeps the last week of them. */
export interface LoggedEntry { entryDate: string; entryTime: string; mealType: MealType }

/**
 * How far ahead reminders are scheduled. They are re-planned whenever the app
 * opens, so the whole back-off below plays out even if it never opens again.
 */
export const REMINDER_DAYS = 7;

/** Learned times aim this early: Android delivers inexact alarms late, never early. */
const LEAD_MINUTES = 30;
/** Days a meal must have been logged before its time is learned. */
const MIN_LEARNING_DAYS = 3;
/** Ignored this many days in a row, reminders drop to every other day. */
const SLOW_DOWN_AFTER = 3;
/** Ignored this many days in a row, one last notice says they are paused. */
export const PAUSE_AFTER = 7;

export type ReminderKind = "nudge" | "paused";

export interface PlannedReminder {
  id: number;
  meal: ReminderMeal;
  at: Date;
  kind: ReminderKind;
  /** Days in a row this meal will have gone unlogged by the time it fires. */
  ignored: number;
  title: string;
  body: string;
}

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const toTime = (minutes: number): string => {
  const wrapped = ((minutes % 1440) + 1440) % 1440;

  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
};

const capitalise = (meal: ReminderMeal) => meal[0].toUpperCase() + meal.slice(1);

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

/** When this meal is usually logged: the median of each day's first entry, once there are enough days. */
export function usualTime(meal: ReminderMeal, entries: readonly LoggedEntry[]): string | undefined {
  const firstByDay = new Map<string, number>();
  for (const entry of entries) {
    if (entry.mealType !== meal) continue;
    const minutes = toMinutes(entry.entryTime);
    const earlier = firstByDay.get(entry.entryDate);
    if (earlier === undefined || minutes < earlier) firstByDay.set(entry.entryDate, minutes);
  }
  if (firstByDay.size < MIN_LEARNING_DAYS) return undefined;

  const sorted = [...firstByDay.values()].sort((a, b) => a - b);

  return toTime(sorted[Math.floor((sorted.length - 1) / 2)]);
}

/** The time the reminder is set for: pinned, learned, or the meal's default while learning. */
export function reminderTime(
  meal: ReminderMeal,
  reminder: MealReminder,
  entries: readonly LoggedEntry[],
): string {
  if (reminder.time !== "auto") return reminder.time;
  const usual = usualTime(meal, entries);

  return usual ? toTime(toMinutes(usual) - LEAD_MINUTES) : DEFAULT_REMINDER_TIME[meal];
}

/** Days in a row before today, back to when the reminder was turned on, without this meal logged. */
export function missedDays(
  meal: ReminderMeal,
  since: string,
  entries: readonly LoggedEntry[],
  today: string,
): number {
  const logged = new Set(entries.filter((entry) => entry.mealType === meal).map((entry) => entry.entryDate));
  let missed = 0;
  for (let day = addDaysISO(today, -1); day >= since && missed < REMINDER_DAYS; day = addDaysISO(day, -1)) {
    if (logged.has(day)) break;
    missed++;
  }

  return missed;
}

/** Days in a row with anything logged, ending today if today has an entry, otherwise yesterday. */
export function streakDays(entries: readonly LoggedEntry[], today: string): number {
  const days = new Set(entries.map((entry) => entry.entryDate));
  let day = days.has(today) ? today : addDaysISO(today, -1);
  let streak = 0;
  while (days.has(day)) {
    streak++;
    day = addDaysISO(day, -1);
  }

  return streak;
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
 * Every reminder for the coming week, decaying the way an unanswered one
 * should: daily, then every other day once three in a row went unlogged, then
 * one notice that they are paused, then nothing. Each future day is planned as
 * though it will be ignored too; opening the app and logging re-plans it all.
 */
export function planReminders(
  settings: ReminderSettings,
  entries: readonly LoggedEntry[],
  now: Date,
  days = REMINDER_DAYS,
): PlannedReminder[] {
  const today = todayISO(now);
  const streak = streakDays(entries, today);
  const planned: PlannedReminder[] = [];

  for (const meal of REMINDER_MEALS) {
    const reminder = settings[meal];
    if (!reminder) continue;

    const time = reminderTime(meal, reminder, entries);
    const usual = reminder.time === "auto" ? usualTime(meal, entries) : undefined;
    const loggedToday = entries.some((entry) => entry.entryDate === today && entry.mealType === meal);
    const missedBefore = loggedToday ? 0 : missedDays(meal, reminder.since, entries, today);

    // Two days past the horizon, so the paused notice lands even when today is
    // already logged and the count only starts tomorrow.
    for (let day = 0; day <= days + 1; day++) {
      if (day === 0 && loggedToday) continue;
      // Ignored days in a row as of this reminder, if every day until then goes unlogged.
      const ignored = loggedToday ? day - 1 : missedBefore + day;
      if (ignored > PAUSE_AFTER) break;
      if (ignored >= SLOW_DOWN_AFTER && ignored < PAUSE_AFTER && ignored % 2 === 1) continue;

      const [hours, minutes] = time.split(":").map(Number);
      const at = new Date(now);
      at.setDate(now.getDate() + day);
      at.setHours(hours, minutes, 0, 0);
      if (at <= now) continue;

      const id = reminderId(meal, at);
      if (ignored === PAUSE_AFTER) {
        // Only ever planned ahead: someone in the app on day seven needs no notice.
        if (day > 0) {
          planned.push({
            id,
            meal,
            at,
            kind: "paused",
            ignored,
            title: `${capitalise(meal)} reminders paused`,
            body: `None in the last week got ${meal} logged. Logging it starts them again.`,
          });
        }
        break;
      }

      planned.push({
        id,
        meal,
        at,
        kind: "nudge",
        ignored,
        title: `Log ${meal}`,
        body: nudgeBody(meal, { usual, ignored }),
      });
    }
  }

  const kept = quietDown(planned.sort((a, b) => a.at.getTime() - b.at.getTime()));
  // The streak is said once, on the next reminder, not on every meal's.
  const next = kept[0];
  if (next?.kind === "nudge" && streak >= 2 && next.ignored < SLOW_DOWN_AFTER) {
    next.body = streakBody(streak);
  }

  return kept;
}

/**
 * Someone drifting away should hear less, not more: a meal in back-off sends
 * nothing on a day another reminder already went out, and several meals
 * pausing together say so in one notice.
 */
function quietDown(sorted: PlannedReminder[]): PlannedReminder[] {
  const kept: PlannedReminder[] = [];
  const daysUsed = new Set<string>();
  const paused = sorted.filter(({ kind }) => kind === "paused");

  for (const reminder of sorted) {
    const day = reminder.at.toDateString();
    if (reminder.kind === "paused") {
      if (reminder !== paused[0]) continue;
      if (paused.length > 1) {
        reminder.title = "Meal reminders paused";
        reminder.body = "None in the last week got a meal logged. Logging one starts them again.";
      }
    } else if (reminder.ignored >= SLOW_DOWN_AFTER && daysUsed.has(day)) {
      continue;
    }
    daysUsed.add(day);
    kept.push(reminder);
  }

  return kept;
}

/** The phone holds a week of entries, so a longer streak is stated as a week, never undercounted. */
function streakBody(streak: number): string {
  return streak > REMINDER_DAYS ? "Logged every day for over a week." : `${streak} days logged in a row.`;
}

/** Facts, not encouragement: how long it has been, or the usual time. */
function nudgeBody(meal: ReminderMeal, { usual, ignored }: { usual?: string; ignored: number }): string {
  if (ignored >= SLOW_DOWN_AFTER) return `No ${meal} logged in ${ignored} days.`;
  if (usual) return `You usually log ${meal} around ${usual}.`;

  return "Tap to add it while you remember.";
}

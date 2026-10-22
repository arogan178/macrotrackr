import { Preferences } from "@capacitor/preferences";

import { isNativePlatform } from "@/services/native/platform";
import type { MealType } from "@/types/macro";
import { todayISO } from "@/utils/dateUtilities";

import {
  type MealReminder,
  nextReminderMeal,
  type PlannedReminder,
  REMINDER_MEALS,
  type ReminderMeal,
  type ReminderSettings,
} from "./reminderPlan";

const SETTINGS_KEY = "meal-reminders";
const OFFERED_KEY = "meal-reminders-offered";
const CHANNEL_ID = "meal-reminders";
const REMINDER_KIND = "meal-reminder";

/* ── Settings, kept on this device ──────────────────────────────────────── */

let settings: ReminderSettings = {};
let settingsLoaded = false;
const settingsListeners = new Set<() => void>();

const isMealReminder = (value: unknown): value is MealReminder =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as MealReminder).time === "string" &&
  typeof (value as MealReminder).since === "string";

/** Anything stored in another shape is dropped, not trusted: the planner would throw on it. */
function parseSettings(value: string | null): ReminderSettings {
  try {
    const stored = JSON.parse(value ?? "{}") as Record<string, unknown>;

    return Object.fromEntries(
      REMINDER_MEALS.filter((meal) => isMealReminder(stored[meal])).map((meal) => [meal, stored[meal]]),
    ) as ReminderSettings;
  } catch {
    return {};
  }
}

export function getReminderSettings(): ReminderSettings {
  return settings;
}

export function subscribeReminderSettings(listener: () => void): () => void {
  settingsListeners.add(listener);

  return () => settingsListeners.delete(listener);
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  if (settingsLoaded) return settings;
  const { value } = await Preferences.get({ key: SETTINGS_KEY });
  settings = parseSettings(value);
  settingsLoaded = true;
  for (const listener of settingsListeners) listener();

  return settings;
}

export async function saveReminderSettings(next: ReminderSettings): Promise<void> {
  settings = next;
  settingsLoaded = true;
  for (const listener of settingsListeners) listener();
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(next) });
}

/** A new reminder follows when the meal is usually logged, from today. */
export const newMealReminder = (): MealReminder => ({ time: "auto", since: todayISO() });

/* ── The one-time offer, made after a meal is logged ────────────────────── */

let offeredMeal: ReminderMeal | null = null;
const offerListeners = new Set<() => void>();

export function getReminderOffer(): ReminderMeal | null {
  return offeredMeal;
}

export function subscribeReminderOffer(listener: () => void): () => void {
  offerListeners.add(listener);

  return () => offerListeners.delete(listener);
}

/**
 * Asked once, in the app only, right after a meal is logged: the moment the
 * reminder is easiest to see the point of. Asked before anything was logged,
 * the permission prompt mostly gets declined.
 */
export async function offerReminderAfterLogging(logged: MealType): Promise<void> {
  if (!isNativePlatform()) return;
  const [{ value: offered }, current] = await Promise.all([
    Preferences.get({ key: OFFERED_KEY }),
    loadReminderSettings(),
  ]);
  if (offered || Object.keys(current).length > 0) return;

  offeredMeal = nextReminderMeal(logged, new Date());
  for (const listener of offerListeners) listener();
}

export async function closeReminderOffer(): Promise<void> {
  offeredMeal = null;
  for (const listener of offerListeners) listener();
  await Preferences.set({ key: OFFERED_KEY, value: "1" });
}

/* ── Scheduling on the phone ────────────────────────────────────────────── */

// Resolves to the module, never the plugin itself: a Capacitor plugin is a
// proxy, and returning one from a promise makes the runtime call `.then()` on
// it, which fails with "LocalNotifications.then() is not implemented".
const loadPlugin = () => import("@capacitor/local-notifications");

export async function requestReminderPermission(): Promise<boolean> {
  const { LocalNotifications: notifications } = await loadPlugin();
  const { display } = await notifications.requestPermissions();

  return display === "granted";
}

export async function hasReminderPermission(): Promise<boolean> {
  const { LocalNotifications: notifications } = await loadPlugin();
  const { display } = await notifications.checkPermissions();

  return display === "granted";
}

async function cancelScheduledReminders(): Promise<void> {
  const { LocalNotifications: notifications } = await loadPlugin();
  const { notifications: pending } = await notifications.getPending();
  const ours = pending.filter((item) => item.extra?.kind === REMINDER_KIND);
  if (ours.length > 0) {
    await notifications.cancel({ notifications: ours.map(({ id }) => ({ id })) });
  }
}

/** Replaces whatever reminders are pending with exactly this plan. */
export async function applyReminderPlan(plan: PlannedReminder[]): Promise<void> {
  const { LocalNotifications: notifications } = await loadPlugin();
  await cancelScheduledReminders();
  if (plan.length === 0) return;

  await notifications.createChannel({
    id: CHANNEL_ID,
    name: "Meal reminders",
    description: "A nudge to log a meal you have not logged yet",
    importance: 3,
  });
  await notifications.schedule({
    notifications: plan.map(({ id, meal, at, kind, title, body }) => ({
      id,
      channelId: CHANNEL_ID,
      title,
      body,
      // Inexact: a meal reminder a few minutes late is fine, and an exact alarm
      // would send the user to Android's "Alarms & reminders" settings first.
      schedule: { at, allowWhileIdle: true },
      isExactNotification: false,
      extra: { kind: REMINDER_KIND, meal, reminder: kind },
    })),
  });
}

/** On sign-out: no reminders, and no record of them, left on the device. */
export async function clearMealReminders(): Promise<void> {
  settings = {};
  offeredMeal = null;
  for (const listener of settingsListeners) listener();
  if (!isNativePlatform()) return;
  await cancelScheduledReminders();
  await Preferences.remove({ key: SETTINGS_KEY });
  await Preferences.remove({ key: OFFERED_KEY });
}

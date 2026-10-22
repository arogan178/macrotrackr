import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import Modal from "@/components/ui/Modal";
import { useRecentMacroEntries } from "@/hooks/queries/useMacroQueries";
import { openLogSheet } from "@/lib/logSheet";
import { useProductAnalytics } from "@/lib/productAnalytics";
import type { MealType } from "@/types/macro";
import { todayISO } from "@/utils/dateUtilities";

import {
  applyReminderPlan,
  closeReminderOffer,
  getReminderOffer,
  getReminderSettings,
  hasReminderPermission,
  loadReminderSettings,
  requestReminderPermission,
  saveReminderSettings,
  subscribeReminderOffer,
  subscribeReminderSettings,
} from "./mealReminders";
import { DEFAULT_REMINDER_TIME, planReminders } from "./reminderPlan";

/**
 * Keeps the phone's scheduled reminders in step with what has been logged:
 * a meal logged today drops today's reminder for it, and every open of the app
 * tops the schedule back up to a week. Mounted for signed-in users in the app.
 */
export default function MealReminders() {
  const settings = useSyncExternalStore(subscribeReminderSettings, getReminderSettings);
  const offer = useSyncExternalStore(subscribeReminderOffer, getReminderOffer);
  const { entries } = useRecentMacroEntries();
  const analytics = useProductAnalytics();
  // Bumped when the app comes back to the foreground, so a new day replans.
  const [resumeCount, setResumeCount] = useState(0);

  const today = todayISO();
  const loggedTodayKey = useMemo(
    () =>
      [...new Set(entries.filter((entry) => entry.entryDate === today).map((entry) => entry.mealType))]
        .sort()
        .join(","),
    [entries, today],
  );

  useEffect(() => {
    void loadReminderSettings();
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") setResumeCount((count) => count + 1);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const loggedToday = new Set(loggedTodayKey.split(",").filter(Boolean) as MealType[]);

    void (async () => {
      // Turned off in Android settings: leave the schedule alone rather than
      // let the plugin raise its own permission prompt.
      if (Object.keys(settings).length > 0 && !(await hasReminderPermission())) return;
      if (isCancelled) return;
      await applyReminderPlan(planReminders(settings, loggedToday, new Date()));
    })().catch((error: unknown) => console.debug("Reminder schedule failed:", error));

    return () => {
      isCancelled = true;
    };
  }, [settings, loggedTodayKey, resumeCount]);

  // A tapped reminder opens straight onto logging.
  useEffect(() => {
    const listener = import("@capacitor/local-notifications").then(({ LocalNotifications }) =>
      LocalNotifications.addListener("localNotificationActionPerformed", () => openLogSheet()),
    );

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  const answer = async (accepted: boolean) => {
    if (!offer) return;
    const meal = offer;
    const permissionGranted = accepted && (await requestReminderPermission());
    if (permissionGranted) {
      await saveReminderSettings({ [meal]: DEFAULT_REMINDER_TIME[meal] });
    }
    analytics.capture({
      event: "reminder_prompt_answered",
      properties: { accepted, meal, permissionGranted },
    });
    await closeReminderOffer();
  };

  return (
    <Modal
      isOpen={offer !== null}
      onClose={() => void answer(false)}
      title={offer ? `Remind you to log ${offer}?` : ""}
      variant="confirmation"
      message={
        offer
          ? `A notification at ${DEFAULT_REMINDER_TIME[offer]} on days you have not logged ${offer} yet. Change it any time in Settings.`
          : ""
      }
      confirmLabel="Remind me"
      cancelLabel="Not now"
      onConfirm={() => void answer(true)}
      size="sm"
    />
  );
}

import { useEffect, useState, useSyncExternalStore } from "react";

import { formStyles } from "@/components/form/FormStyles";
import Panel from "@/components/ui/Panel";
import { useRecentMacroEntries } from "@/hooks/queries/useMacroQueries";
import { cn } from "@/lib/classnameUtilities";
import { todayISO } from "@/utils/dateUtilities";

import {
  getReminderSettings,
  loadReminderSettings,
  newMealReminder,
  requestReminderPermission,
  saveReminderSettings,
  subscribeReminderSettings,
} from "./mealReminders";
import {
  type MealReminder,
  missedDays,
  PAUSE_AFTER,
  REMINDER_MEALS,
  type ReminderMeal,
  reminderTime,
  usualTime,
} from "./reminderPlan";

const LABEL: Record<ReminderMeal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** Says where the time came from, so a reminder that moved is not a surprise. */
function describe(
  meal: ReminderMeal,
  reminder: MealReminder,
  entries: ReturnType<typeof useRecentMacroEntries>["entries"],
): string {
  if (missedDays(meal, reminder.since, entries, todayISO()) >= PAUSE_AFTER) {
    return `Paused: no ${meal} logged in a week. Logging it starts them again.`;
  }
  if (reminder.time !== "auto") return "Set by you";
  const usual = usualTime(meal, entries);

  return usual
    ? `Just before you usually log ${meal}, around ${usual}`
    : `Moves to just before you usually log ${meal} after three days`;
}

/** One row per meal: on or off, and when. Lives on this phone, not the account. */
export default function ReminderSettings() {
  const settings = useSyncExternalStore(subscribeReminderSettings, getReminderSettings);
  const { entries } = useRecentMacroEntries();
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    void loadReminderSettings();
  }, []);

  const toggle = async (meal: ReminderMeal, isOn: boolean) => {
    if (isOn && !(await requestReminderPermission())) {
      setIsBlocked(true);

      return;
    }
    setIsBlocked(false);
    const next = { ...settings };
    if (isOn) next[meal] = newMealReminder();
    else delete next[meal];
    await saveReminderSettings(next);
  };

  const update = (meal: ReminderMeal, time: MealReminder["time"]) => {
    const current = settings[meal];
    if (current && time) void saveReminderSettings({ ...settings, [meal]: { ...current, time } });
  };

  return (
    <Panel
      title="Meal reminders"
      description="A notification on days you have not logged that meal yet, fewer if they go unanswered. Set on this phone only."
      flatOnPhone
    >
      <ul className="divide-y divide-border">
        {REMINDER_MEALS.map((meal) => {
          const reminder = settings[meal];
          const id = `reminder-${meal}`;

          return (
            <li key={meal} className="flex min-h-16 items-center justify-between gap-4 py-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={id} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    id={id}
                    type="checkbox"
                    checked={Boolean(reminder)}
                    onChange={(event) => void toggle(meal, event.target.checked)}
                    className="h-5 w-5 rounded-control border-border accent-primary"
                  />
                  {LABEL[meal]}
                </label>
                {reminder && (
                  <p className="pl-8 text-xs text-muted">
                    {describe(meal, reminder, entries)}
                    {reminder.time !== "auto" && (
                      <>
                        {" "}
                        <button
                          type="button"
                          onClick={() => update(meal, "auto")}
                          className="min-h-11 text-foreground underline decoration-border underline-offset-4"
                        >
                          Use my usual time
                        </button>
                      </>
                    )}
                  </p>
                )}
              </div>
              <input
                type="time"
                aria-label={`${LABEL[meal]} reminder time`}
                value={reminder ? reminderTime(meal, reminder, entries) : ""}
                disabled={!reminder}
                // Choosing a time pins it; "Use my usual time" lets it follow again.
                onChange={(event) => update(meal, event.target.value)}
                className={cn(
                  formStyles.input.base,
                  formStyles.input.normal,
                  !reminder && formStyles.input.disabled,
                  "w-32 shrink-0",
                )}
              />
            </li>
          );
        })}
      </ul>

      {isBlocked && (
        <p role="alert" className="mt-3 text-sm text-muted">
          Notifications are off for MacroTrackr. Turn them on in your phone&rsquo;s settings,
          then try again.
        </p>
      )}
    </Panel>
  );
}

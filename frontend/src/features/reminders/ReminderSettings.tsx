import { useEffect, useState, useSyncExternalStore } from "react";

import { formStyles } from "@/components/form/FormStyles";
import Panel from "@/components/ui/Panel";
import { cn } from "@/lib/classnameUtilities";

import {
  getReminderSettings,
  loadReminderSettings,
  requestReminderPermission,
  saveReminderSettings,
  subscribeReminderSettings,
} from "./mealReminders";
import { DEFAULT_REMINDER_TIME, REMINDER_MEALS, type ReminderMeal } from "./reminderPlan";

const LABEL: Record<ReminderMeal, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

/** One row per meal: on or off, and when. Lives on this phone, not the account. */
export default function ReminderSettings() {
  const settings = useSyncExternalStore(subscribeReminderSettings, getReminderSettings);
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
    if (isOn) next[meal] = DEFAULT_REMINDER_TIME[meal];
    else delete next[meal];
    await saveReminderSettings(next);
  };

  const setTime = (meal: ReminderMeal, time: string) => {
    if (time) void saveReminderSettings({ ...settings, [meal]: time });
  };

  return (
    <Panel
      title="Meal reminders"
      description="A notification on days you have not logged that meal yet. Set on this phone only."
      flatOnPhone
    >
      <ul className="divide-y divide-border">
        {REMINDER_MEALS.map((meal) => {
          const time = settings[meal];
          const id = `reminder-${meal}`;

          return (
            <li key={meal} className="flex min-h-14 items-center justify-between gap-4 py-2">
              <label htmlFor={id} className="flex min-h-12 flex-1 cursor-pointer items-center gap-3 text-sm">
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(time)}
                  onChange={(event) => void toggle(meal, event.target.checked)}
                  className="h-5 w-5 rounded-control border-border accent-primary"
                />
                {LABEL[meal]}
              </label>
              <input
                type="time"
                aria-label={`${LABEL[meal]} reminder time`}
                value={time ?? DEFAULT_REMINDER_TIME[meal]}
                disabled={!time}
                onChange={(event) => setTime(meal, event.target.value)}
                className={cn(
                  formStyles.input.base,
                  formStyles.input.normal,
                  !time && formStyles.input.disabled,
                  "w-32",
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

import { useForm, useStore } from "@tanstack/react-form";

import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import TextField from "@/components/form/TextField";
import { HabitFrequency, HabitGoalFormValues } from "@/types/habit";

import { HABIT_ICONS } from "../../constants/habits";

import HabitCard from "./HabitCard";

const COLOR_OPTIONS = [
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "lime", label: "Lime", class: "bg-lime-500" },
  { value: "yellow", label: "Yellow", class: "bg-yellow-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
];

const COLOR_TEXT_RING_MAP = {
  indigo: { text: "text-indigo-400", ring: "ring-indigo-400" },
  blue: { text: "text-blue-400", ring: "ring-blue-400" },
  cyan: { text: "text-cyan-400", ring: "ring-cyan-400" },
  teal: { text: "text-teal-400", ring: "ring-teal-400" },
  green: { text: "text-green-400", ring: "ring-green-400" },
  lime: { text: "text-lime-400", ring: "ring-lime-400" },
  yellow: { text: "text-yellow-400", ring: "ring-yellow-400" },
  orange: { text: "text-orange-400", ring: "ring-orange-400" },
  red: { text: "text-red-400", ring: "ring-red-400" },
  pink: { text: "text-pink-400", ring: "ring-pink-400" },
  purple: { text: "text-purple-400", ring: "ring-purple-400" },
} as const;

const COLOR_GRADIENT_CHIP_MAP = {
  indigo: {
    from: "from-indigo-500/20",
    to: "to-indigo-500/5",
    chip: "bg-indigo-400/10",
    text: "text-indigo-400",
  },
  blue: {
    from: "from-blue-500/20",
    to: "to-blue-500/5",
    chip: "bg-blue-400/10",
    text: "text-blue-400",
  },
  cyan: {
    from: "from-cyan-500/20",
    to: "to-cyan-500/5",
    chip: "bg-cyan-400/10",
    text: "text-cyan-400",
  },
  teal: {
    from: "from-teal-500/20",
    to: "to-teal-500/5",
    chip: "bg-teal-400/10",
    text: "text-teal-400",
  },
  green: {
    from: "from-green-500/20",
    to: "to-green-500/5",
    chip: "bg-green-400/10",
    text: "text-green-400",
  },
  lime: {
    from: "from-lime-500/20",
    to: "to-lime-500/5",
    chip: "bg-lime-400/10",
    text: "text-lime-400",
  },
  yellow: {
    from: "from-yellow-500/20",
    to: "to-yellow-500/5",
    chip: "bg-yellow-400/10",
    text: "text-yellow-400",
  },
  orange: {
    from: "from-orange-500/20",
    to: "to-orange-500/5",
    chip: "bg-orange-400/10",
    text: "text-orange-400",
  },
  red: {
    from: "from-red-500/20",
    to: "to-red-500/5",
    chip: "bg-red-400/10",
    text: "text-red-400",
  },
  pink: {
    from: "from-pink-500/20",
    to: "to-pink-500/5",
    chip: "bg-pink-400/10",
    text: "text-pink-400",
  },
  purple: {
    from: "from-purple-500/20",
    to: "to-purple-500/5",
    chip: "bg-purple-400/10",
    text: "text-purple-400",
  },
} as const;

export const validateTitle = ({ value }: { value: string }) =>
  value.trim() ? undefined : "Title is required";

// Lets the form prop below be typed by inference instead of useForm's generics.
export function useHabitForm(
  defaultValues: HabitGoalFormValues,
  onSubmit: (values: HabitGoalFormValues) => Promise<void>,
) {
  return useForm({ defaultValues, onSubmit: ({ value }) => onSubmit(value) });
}

interface HabitFormProps {
  form: ReturnType<typeof useHabitForm>;
  currentProgress?: number;
}

function HabitForm({ form, currentProgress = 0 }: HabitFormProps) {
  const values = useStore(form.store, (state) => state.values);

  type AccentKey = keyof typeof COLOR_TEXT_RING_MAP;
  const accentKey = values.accentColor as AccentKey;
  const colorText = COLOR_TEXT_RING_MAP[accentKey].text;
  const colorRing = COLOR_TEXT_RING_MAP[accentKey].ring;
  const grad = COLOR_GRADIENT_CHIP_MAP[accentKey];

  return (
    <div className="space-y-6">
      <form.Field name="title" validators={{ onChange: validateTitle }}>
        {(field) => (
          <TextField
            label="Habit Title"
            value={field.state.value}
            onChange={field.handleChange}
            placeholder="Enter a title for your habit"
            error={field.state.meta.errors[0]}
            required
          />
        )}
      </form.Field>

      <div>
        <div className="grid grid-cols-2 gap-4">
          <form.Field name="target">
            {(field) => (
              <NumberField
                label="Target"
                value={field.state.value}
                onChange={(value: number | undefined) =>
                  field.handleChange(Math.max(1, Number(value) || 1))
                }
                min={1}
                max={100}
                required
              />
            )}
          </form.Field>
          <form.Field name="frequency">
            {(field) => (
              <Dropdown
                id="habit-frequency"
                label="Frequency"
                options={FREQUENCY_OPTIONS}
                value={field.state.value ?? "daily"}
                onChange={(value) => field.handleChange(value as HabitFrequency)}
              />
            )}
          </form.Field>
        </div>
        <p className="mt-1 text-xs text-muted">
          {values.frequency === "weekly"
            ? "How many times a week. Progress resets on Monday."
            : "How many times a day. Progress resets at midnight."}
        </p>
      </div>

      <div>
        <label
          htmlFor="icon-button-group"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Icon
        </label>
        <div
          id="icon-button-group"
          className="grid grid-cols-5 gap-2"
          role="group"
          aria-label="Icon selection"
        >
          {Object.entries(HABIT_ICONS).map(([key, IconComponent]) => {
            const isSelected = values.iconName === key;

            return (
              <button
                key={key}
                type="button"
                className={`flex items-center justify-center rounded-control p-3 transition-colors ${
                  isSelected
                    ? `${grad.chip} border ${colorRing}`
                    : "bg-surface-2 hover:bg-surface-3"
                }`}
                onClick={() => form.setFieldValue("iconName", key)}
                aria-pressed={isSelected}
                aria-label={
                  key.charAt(0).toUpperCase() + key.slice(1) + " icon"
                }
              >
                <IconComponent
                  className={`h-4 w-4 ${isSelected ? colorText : "text-foreground"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="color-button-group"
          className="mb-1 block text-sm font-medium text-foreground"
        >
          Color
        </label>
        <div
          id="color-button-group"
          className="flex space-x-2"
          role="group"
          aria-label="Color selection"
        >
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`h-8 w-8 rounded-full ${color.class} ${
                values.accentColor === color.value
                  ? "ring-2 ring-white/60"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => form.setFieldValue("accentColor", color.value)}
              aria-pressed={values.accentColor === color.value}
              aria-label={`Select ${color.label} color`}
            />
          ))}
          <input
            type="hidden"
            name="accentColor"
            value={values.accentColor ?? ""}
          />
        </div>
      </div>

      <input type="hidden" name="iconName" value={values.iconName} />
      <input type="hidden" name="current" value={currentProgress} />
      <input
        type="hidden"
        name="progress"
        value={Math.min(
          100,
          Math.max(
            0,
            values.target > 0
              ? Math.round((currentProgress / values.target) * 100)
              : 0,
          ),
        )}
      />

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
        <div className="pointer-events-none">
          <HabitCard
            variant="sm"
            habit={{
              id: undefined,
              title: values.title,
              iconName: values.iconName,
              current: currentProgress,
              target: values.target,
              progress: undefined,
              accentColor: values.accentColor ?? "indigo",
              frequency: values.frequency,
              isComplete: false,
            }}
            show={{ completionBadge: false }}
          />
        </div>
      </div>
    </div>
  );
}

export default HabitForm;

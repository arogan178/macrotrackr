// The updated HabitForm.tsx, removing isSubmitting prop since it's not used
import { useMemo } from "react";

import { NumberField, TextField } from "@/components/form";
import {
  AwardIcon,
  BookIcon,
  CalendarIcon,
  CheckCircleIcon,
  CoffeeIcon,
  DropletIcon,
  DumbBellIcon,
  HeartIcon,
  MoonIcon,
  SunIcon,
  TargetIcon,
} from "@/components/ui";

import { HabitGoalFormValues } from "../types/types";

const AVAILABLE_ICONS = {
  calendar: CalendarIcon,
  "check-circle": CheckCircleIcon,
  target: TargetIcon,
  award: AwardIcon,
  heart: HeartIcon,
  book: BookIcon,
  coffee: CoffeeIcon,
  droplet: DropletIcon,
  dumbbell: DumbBellIcon,
  moon: MoonIcon,
  sun: SunIcon,
} as const;

const COLOR_OPTIONS = [
  { value: "indigo", label: "Indigo", class: "bg-primary" },
  { value: "blue", label: "Blue", class: "bg-primary" },
  { value: "green", label: "Green", class: "bg-success" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
] as const;

interface HabitFormProps {
  // Changed: Accept current values as a prop
  values: HabitGoalFormValues;
  // Changed: Accept a single onChange handler for all fields
  onChange: (field: keyof HabitGoalFormValues, value: string | number) => void;
  // Changed: Accept errors as a prop
  errors: Partial<Record<keyof HabitGoalFormValues, string>>;
  // Add prop for current progress when editing
  currentProgress?: number;
}

function HabitForm({
  values,
  onChange,
  errors,
  currentProgress = 0, // Default to 0 if not provided
}: HabitFormProps) {
  const handleChange = (
    field: keyof HabitGoalFormValues,
    value: string | number | undefined, // Allow undefined temporarily from NumberField
  ) => {
    // Ensure target is never undefined or less than 1 when passed up
    if (field === "target") {
      onChange(field, Math.max(1, Number(value) || 1));
    } else {
      onChange(field, value as string | number); // Type assertion needed here
    }
  };

  const selectedIcon = useMemo(() => {
    const IconComponent =
      AVAILABLE_ICONS[values.iconName as keyof typeof AVAILABLE_ICONS];
    return IconComponent ? (
      <IconComponent size="sm" />
    ) : (
      <TargetIcon size="sm" />
    );
  }, [values.iconName]);

  const previewProgressPercentage = useMemo(() => {
    if (values.target <= 0) return 0;
    return Math.min(100, Math.round((currentProgress / values.target) * 100));
  }, [currentProgress, values.target]);

  return (
    <div className="space-y-6">
      {/* Title field */}
      <div>
        <TextField
          label="Habit Title"
          value={values.title} // Use prop value
          onChange={(value) => handleChange("title", value)}
          placeholder="Enter a title for your habit"
          error={errors.title} // Use prop error
          required
        />
      </div>

      {/* Target number field */}
      <div>
        <NumberField
          label="Target"
          value={values.target} // Use prop value
          onChange={(value) => handleChange("target", value)} // Pass undefined directly
          min={1}
          max={100}
          error={errors.target} // Use prop error
          required
        />
        <p className="mt-1 text-xs text-foreground">
          Set how many times you need to complete this habit to reach your goal
        </p>
      </div>

      {/* Icon selection */}
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
          {Object.entries(AVAILABLE_ICONS).map(([key, IconComponent]) => (
            <button
              key={key}
              type="button"
              className={`flex items-center justify-center rounded-lg p-3 ${
                values.iconName === key
                  ? `bg-${values.accentColor}-500/20 border- border${values.accentColor}-500/50`
                  : "bg-surface/40 hover:bg-surface/60"
              }`}
              onClick={() => handleChange("iconName", key)}
              aria-pressed={values.iconName === key}
              aria-label={key.charAt(0).toUpperCase() + key.slice(1) + " icon"}
            >
              <IconComponent
                size="sm"
                className={
                  values.iconName === key
                    ? `text-${values.accentColor}-400`
                    : "text-foreground"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color selection */}
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
                  ? "ring-opacity-60 ring-2 ring-white"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => handleChange("accentColor", color.value)}
              aria-pressed={values.accentColor === color.value}
              aria-label={`Select ${color.label} color`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-foreground">Preview</p>
        <div className={"overflow-hidden rounded-lg bg-surface/30"}>
          <div
            className={`from- bg-gradient-to-r${values.accentColor}-500/20 to-${values.accentColor}-500/5 p-3`}
          >
            <div className="mb-2 flex items-center">
              <div
                className={`text- rounded-lg p-1.5${values.accentColor}-400 bg-${values.accentColor}-400/10 mr-2`}
              >
                {selectedIcon}
              </div>
              <h4 className="font-medium text-foreground">
                {values.title || "Habit Title"}
              </h4>
            </div>

            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-baseline gap-1">
                {/* Use currentProgress prop here */}
                <span className="text-xl font-bold text-foreground">
                  {currentProgress}
                </span>
                <span className="text-sm text-foreground">
                  / {values.target}
                </span>
              </div>
              {/* Use calculated preview percentage */}
              <span className="text-sm text-foreground">
                {previewProgressPercentage}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-surface/60">
              <div
                className={`bg- h-full${values.accentColor}-500 rounded-full`}
                /* Use calculated preview percentage for width */
                style={{ width: `${previewProgressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HabitForm;

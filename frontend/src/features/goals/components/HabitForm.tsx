import { useState, useMemo, useEffect } from "react";
import { HabitGoalFormValues } from "../types";
import { TextField, NumberField } from "@/components/form";
import {
  CalendarIcon,
  CheckCircleIcon,
  TargetIcon,
  AwardIcon,
  HeartIcon,
  BookIcon,
  CoffeeIcon,
  DropletIcon,
  DumbBellIcon,
  MoonIcon,
  SunIcon,
} from "@/components/Icons";
import { ICON_SIZES } from "@/components/utils/constants";

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
};

const COLOR_OPTIONS = [
  { value: "indigo", label: "Indigo", class: "bg-indigo-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
];

interface HabitFormProps {
  onSubmit?: (values: HabitGoalFormValues) => void;
  onChange?: (values: HabitGoalFormValues, isValid: boolean) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  initialValues?: Partial<HabitGoalFormValues>;
  hideButtons?: boolean;
}

function HabitForm({
  onSubmit,
  onChange,
  onCancel,
  isSubmitting = false,
  initialValues,
}: HabitFormProps) {
  const [formValues, setFormValues] = useState<HabitGoalFormValues>({
    title: initialValues?.title || "",
    iconName: initialValues?.iconName || "target",
    target: initialValues?.target || 7,
    accentColor: initialValues?.accentColor || "indigo",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof HabitGoalFormValues, string>>
  >({});

  // Calculate form validity
  const isFormValid = useMemo(() => {
    return (
      !!formValues.title.trim() &&
      formValues.target > 0 &&
      Object.keys(errors).length === 0
    );
  }, [formValues, errors]);

  // Send form values and validation state to parent if onChange is provided
  useEffect(() => {
    if (onChange) {
      onChange(formValues, isFormValid);
    }
  }, [formValues, isFormValid, onChange]);

  const handleChange = (field: keyof HabitGoalFormValues, value: any) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));

    // Clear error when field is changed
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof HabitGoalFormValues, string>> = {};

    if (!formValues.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formValues.target || formValues.target <= 0) {
      newErrors.target = "Target must be greater than zero";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate() && onSubmit) {
      onSubmit(formValues);
    }
  };

  const selectedIcon = useMemo(() => {
    const IconComponent =
      AVAILABLE_ICONS[formValues.iconName as keyof typeof AVAILABLE_ICONS];
    return IconComponent ? (
      <IconComponent size="sm" />
    ) : (
      <TargetIcon size="sm" />
    );
  }, [formValues.iconName]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title field */}
      <div>
        <TextField
          label="Habit Title"
          id="habit-title"
          value={formValues.title}
          onChange={(value) => handleChange("title", value)}
          placeholder="Enter a title for your habit"
          error={errors.title}
          required
        />
      </div>

      {/* Target number field */}
      <div>
        <NumberField
          label="Target"
          id="habit-target"
          value={formValues.target}
          onChange={(value) => handleChange("target", value)}
          min={1}
          max={100}
          placeholder="How many times to complete this habit"
          error={errors.target}
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Set how many times you need to complete this habit to reach your goal
        </p>
      </div>

      {/* Icon selection */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Icon
        </label>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(AVAILABLE_ICONS).map(([key, IconComponent]) => (
            <button
              key={key}
              type="button"
              className={`p-3 rounded-lg flex items-center justify-center ${
                formValues.iconName === key
                  ? `bg-${formValues.accentColor}-500/20 border border-${formValues.accentColor}-500/50`
                  : "bg-gray-700/40 hover:bg-gray-700/60"
              }`}
              onClick={() => handleChange("iconName", key)}
            >
              <IconComponent
                size="sm"
                className={
                  formValues.iconName === key
                    ? `text-${formValues.accentColor}-400`
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color selection */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-1">
          Color
        </label>
        <div className="flex space-x-2">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color.value}
              type="button"
              className={`w-8 h-8 rounded-full ${color.class} ${
                formValues.accentColor === color.value
                  ? "ring-2 ring-white ring-opacity-60"
                  : "opacity-70 hover:opacity-100"
              }`}
              onClick={() => handleChange("accentColor", color.value)}
              aria-label={`Select ${color.label} color`}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-300 mb-2">Preview</p>
        <div className={`bg-gray-700/30 rounded-lg overflow-hidden`}>
          <div
            className={`bg-gradient-to-r from-${formValues.accentColor}-500/20 to-${formValues.accentColor}-500/5 p-3`}
          >
            <div className="flex items-center mb-2">
              <div
                className={`p-1.5 rounded-lg text-${formValues.accentColor}-400 bg-${formValues.accentColor}-400/10 mr-2`}
              >
                {selectedIcon}
              </div>
              <h4 className="font-medium text-gray-200">
                {formValues.title || "Habit Title"}
              </h4>
            </div>

            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-gray-200">0</span>
                <span className="text-gray-400 text-sm">
                  / {formValues.target}
                </span>
              </div>
              <span className="text-sm text-gray-400">0%</span>
            </div>

            <div className="w-full h-2 bg-gray-700/60 rounded-full overflow-hidden">
              <div
                className={`h-full bg-${formValues.accentColor}-500 rounded-full`}
                style={{ width: "0%" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

export default HabitForm;

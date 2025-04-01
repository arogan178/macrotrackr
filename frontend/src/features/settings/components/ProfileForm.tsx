import { TextField, NumberField, Dropdown, DateField } from "@/components/form";
import { UserSettings, Gender, ActivityLevel } from "@/features/settings/types";
import {
  GENDER_OPTIONS,
  ACTIVITY_LEVELS,
  getActivityLevelFromString,
} from "../constants";

interface ProfileFormProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K]
  ) => void;
  formErrors: Record<string, string>;
}

export default function ProfileForm({
  settings,
  updateSetting,
  formErrors,
}: ProfileFormProps) {
  // This function helps convert between numeric values in the database and string values in the UI
  function getActivityLevelOptions() {
    return Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => ({
      value: Number(key), // Use numeric keys for values
      label,
    }));
  }

  // Convert string activity level to number if needed
  const activityLevelValue =
    typeof settings.activity_level === "string" && settings.activity_level
      ? getActivityLevelFromString(settings.activity_level as ActivityLevel)
      : settings.activity_level;

  // Ensure weight is a valid positive number
  const handleWeightChange = (value: number | undefined) => {
    // Don't allow undefined, negative or zero weights
    const validWeight = value && value > 0 ? value : undefined;
    updateSetting("weight", validWeight);
  };

  // Ensure height is a valid positive number
  const handleHeightChange = (value: number | undefined) => {
    // Don't allow undefined, negative or zero heights
    const validHeight = value && value > 0 ? value : undefined;
    updateSetting("height", validHeight);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TextField
        label="First Name"
        value={settings.first_name || ""}
        onChange={(value) => updateSetting("first_name", value)}
        error={formErrors.first_name}
        required
      />

      <TextField
        label="Last Name"
        value={settings.last_name || ""}
        onChange={(value) => updateSetting("last_name", value)}
        error={formErrors.last_name}
        required
      />

      <TextField
        label="Email"
        value={settings.email || ""}
        type="email"
        onChange={(value) => updateSetting("email", value)}
        error={formErrors.email}
        required
      />

      <DateField
        label="Date of Birth"
        value={settings.date_of_birth || ""}
        onChange={(value) => updateSetting("date_of_birth", value)}
        error={formErrors.date_of_birth}
        required
      />

      <Dropdown
        label="Gender"
        value={settings.gender || ""}
        onChange={(value) => updateSetting("gender", value as Gender)}
        options={GENDER_OPTIONS}
        error={formErrors.gender}
        required
      />

      <NumberField
        label="Height (cm)"
        value={settings.height}
        onChange={handleHeightChange}
        error={formErrors.height}
        min={100}
        max={250}
        step={1}
        unit="cm"
        required
      />

      <NumberField
        label="Weight (kg)"
        value={settings.weight}
        onChange={handleWeightChange}
        error={formErrors.weight}
        min={30}
        max={300}
        step={0.1}
        unit="kg"
        required
      />

      <Dropdown
        label="Activity Level"
        value={activityLevelValue || ""} // Use the converted numeric value
        onChange={(value) => updateSetting("activity_level", Number(value))} // Ensure we store as number
        options={getActivityLevelOptions()}
        error={formErrors.activity_level}
        required
      />
    </div>
  );
}

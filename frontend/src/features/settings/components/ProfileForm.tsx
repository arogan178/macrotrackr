import {
  TextField,
  NumberField,
  Dropdown,
  DateField,
} from "@/components/form/index";
import { UserSettings, Gender } from "../types";
import { GENDER_OPTIONS, ACTIVITY_LEVELS } from "../constants";

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

      <NumberField
        label="Height (cm)"
        value={settings.height}
        onChange={(value) => updateSetting("height", value || 0)}
        error={formErrors.height}
        unit="cm"
        required
      />

      <NumberField
        label="Weight (kg)"
        value={settings.weight}
        onChange={(value) => updateSetting("weight", value || 0)}
        error={formErrors.weight}
        unit="kg"
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

      <Dropdown
        label="Activity Level"
        value={settings.activity_level || ""}
        onChange={(value) => updateSetting("activity_level", value)}
        options={Object.entries(ACTIVITY_LEVELS).map(
          ([, { label, value }]) => ({
            value,
            label,
          })
        )}
        error={formErrors.activity_level}
        required
      />
    </div>
  );
}

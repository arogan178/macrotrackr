import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import HeightField from "@/components/form/HeightField";
import TextField from "@/components/form/TextField";
import WeightField from "@/components/form/WeightField";
import { Button } from "@/components/ui";
import Panel from "@/components/ui/Panel";
import { type Gender, type UserSettings } from "@/types/user";
import type { UnitSystem } from "@/utils/unitConversion";
import {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
  UNIT_SYSTEM_OPTIONS,
} from "@/utils/userConstants";

interface ProfileFormProps {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  formErrors: Record<string, string>;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  hasChanges: boolean;
}

function getActivityLevelOptions() {
  return Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => ({
    value: Number(key), // Use numeric keys for values
    label,
  }));
}

export default function ProfileForm({
  settings,
  updateSetting,
  formErrors,
  onSubmit,
  isSaving,
  hasChanges,
}: ProfileFormProps) {
  // Convert string activity level to number if needed
  const activityLevelValue = settings.activityLevel;
  const unitSystem = settings.unitSystem ?? "metric";

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
    <Panel padding="none">
      <form onSubmit={onSubmit}>
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
          <TextField
            label="First Name"
            value={settings.firstName}
            onChange={(value) => {
              updateSetting("firstName", value);
            }}
            error={formErrors.firstName}
            required
          />

          <TextField
            label="Last Name"
            value={settings.lastName}
            onChange={(value) => {
              updateSetting("lastName", value);
            }}
            error={formErrors.lastName}
            required
          />

          <TextField
            label="Email"
            value={settings.email}
            type="email"
            onChange={(value) => {
              updateSetting("email", value);
            }}
            error={formErrors.email}
            required
          />

          <DateField
            label="Date of Birth"
            value={settings.dateOfBirth ?? ""}
            onChange={(value) => {
              updateSetting("dateOfBirth", value);
            }}
            error={formErrors.dateOfBirth}
            required
          />

          <Dropdown
            label="Gender"
            value={settings.gender ?? ""}
            onChange={(value) => {
              updateSetting("gender", value as Gender);
            }}
            options={GENDER_OPTIONS}
            error={formErrors.gender}
            required
          />

          <Dropdown
            label="Units"
            value={unitSystem}
            onChange={(value) => {
              updateSetting("unitSystem", value as UnitSystem);
            }}
            options={UNIT_SYSTEM_OPTIONS}
          />

          <HeightField
            label="Height"
            value={settings.height ?? undefined}
            onChange={handleHeightChange}
            error={formErrors.height}
            unitSystem={unitSystem}
            min={100}
            max={250}
            required
          />

          <WeightField
            label="Weight"
            value={settings.weight ?? undefined}
            onChange={handleWeightChange}
            error={formErrors.weight}
            unitSystem={unitSystem}
            minKg={30}
            maxKg={300}
            required
          />

          <Dropdown
            label="Activity Level"
            value={activityLevelValue ?? ""} // Use the converted numeric value
            onChange={(value) => {
              updateSetting("activityLevel", value ? Number(value) : undefined);
            }} // Ensure we store as number or undefined
            options={getActivityLevelOptions()}
            error={formErrors.activityLevel}
            placeholder="Select activity level"
            required
          />
        </div>

        </div>

        {/* The unsaved indicator and the save action are the same object, and
            it stays reachable: on a phone the button used to be off-screen
            from the badge that told you there was something to save. */}
        <div className="sticky bottom-0 z-20 flex items-center justify-between gap-3 border-t border-border bg-surface-2 px-4 py-3 pb-[calc(0.75rem+var(--sab))] sm:px-6">
          <span className="text-xs text-muted" aria-live="polite">
            {hasChanges ? "Unsaved changes" : "All changes saved"}
          </span>
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={!hasChanges || Object.keys(formErrors).length > 0}
            text="Save changes"
            buttonSize="md"
            variant="primary"
          />
        </div>
      </form>
    </Panel>
  );
}

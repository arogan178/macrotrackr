import CardContainer from "@/components/form/CardContainer";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import NumberField from "@/components/form/NumberField";
import TextField from "@/components/form/TextField";
import { Button } from "@/components/ui";
import { type Gender, type UserSettings } from "@/types/user";
import { ACTIVITY_LEVELS, GENDER_OPTIONS } from "@/utils/userConstants";

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
    <CardContainer className="p-3.5 sm:p-6">
      <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
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

          <NumberField
            label="Height (cm)"
            value={settings.height ?? undefined}
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
            value={settings.weight ?? undefined}
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

        {/* Submit button section */}
        <div className="mt-4 sm:mt-6 flex justify-end">
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={!hasChanges || Object.keys(formErrors).length > 0}
            text="Save Changes"
            buttonSize="md"
            variant="primary"
            className="w-full sm:w-auto"
          />
        </div>
      </form>
    </CardContainer>
  );
}

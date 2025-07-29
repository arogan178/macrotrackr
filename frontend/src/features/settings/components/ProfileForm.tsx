import {
  CardContainer,
  DateField,
  Dropdown,
  NumberField,
  TextField,
} from "@/components/form";
import { Button, UserIcon } from "@/components/ui";
import {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
  getActivityLevelFromString,
} from "@/features/settings/utils/constants";
import {
  type ActivityLevel,
  type Gender,
  type UserSettings,
} from "@/types/user";

type ProfileFormProps = {
  settings: UserSettings;
  updateSetting: <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
  ) => void;
  formErrors: Record<string, string>;
  onSubmit: (event: React.FormEvent) => Promise<void>;
  isSaving: boolean;
  hasChanges: boolean;
};

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
  const activityLevelValue =
    typeof settings.activityLevel === "string" && settings.activityLevel
      ? getActivityLevelFromString(settings.activityLevel as ActivityLevel)
      : settings.activityLevel;

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
    <CardContainer className="p-6 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-8">
        {/* Header section to match BillingForm pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-indigo-400/20 to-indigo-500/20 rounded-xl mr-4">
              <UserIcon className="w-7 h-7 text-indigo-400 flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-gray-100 truncate">
                Profile Information
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                Update your personal details and preferences
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TextField
            label="First Name"
            value={settings.firstName || ""}
            onChange={(value) => {
              updateSetting("firstName", value);
            }}
            error={formErrors.firstName}
            required
          />

          <TextField
            label="Last Name"
            value={settings.lastName || ""}
            onChange={(value) => {
              updateSetting("lastName", value);
            }}
            error={formErrors.lastName}
            required
          />

          <TextField
            label="Email"
            value={settings.email || ""}
            type="email"
            onChange={(value) => {
              updateSetting("email", value);
            }}
            error={formErrors.email}
            required
          />

          <DateField
            label="Date of Birth"
            value={settings.dateOfBirth || ""}
            onChange={(value) => {
              updateSetting("dateOfBirth", value);
            }}
            error={formErrors.dateOfBirth}
            required
          />

          <Dropdown
            label="Gender"
            value={settings.gender || ""}
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
            value={activityLevelValue || ""} // Use the converted numeric value
            onChange={(value) => {
              updateSetting("activityLevel", Number(value));
            }} // Ensure we store as number
            options={getActivityLevelOptions()}
            error={formErrors.activityLevel}
            required
          />
        </div>

        {/* Submit button section */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            isLoading={isSaving}
            disabled={!hasChanges || Object.keys(formErrors).length > 0}
            text="Save Changes"
            buttonSize="lg"
            variant="primary"
            className="px-8 py-3 text-lg"
          />
        </div>
      </form>
    </CardContainer>
  );
}

import { memo } from "react";
import { UserDetails } from "../../types";
import { TextField, NumberField, SelectField } from "../FormComponents";
import { getActivityLevelOptions } from "../../utils/activityLevels";

interface ProfileFormProps {
  settings: UserDetails;
  updateSetting: <K extends keyof UserDetails>(key: K, value: UserDetails[K]) => void;
  formErrors: Record<string, string>;
}

// const MINIMUM_AGE = 18;

function ProfileForm({ settings, updateSetting, formErrors }: ProfileFormProps) {
  const getFieldError = (field: string) => formErrors[field] || '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <TextField
          label="First Name"
          value={settings.first_name}
          onChange={(value) => updateSetting('first_name', value)}
          required
          error={getFieldError('first_name')}
        />

        <TextField
          label="Last Name"
          value={settings.last_name}
          onChange={(value) => updateSetting('last_name', value)}
          required
          error={getFieldError('last_name')}
        />

        <TextField
          label="Email Address"
          type="email"
          value={settings.email}
          onChange={(value) => updateSetting('email', value)}
          required
          error={getFieldError('email')}
        />

        <TextField
          label="Date of Birth"
          type="date"
          value={settings.date_of_birth || ''}
          onChange={(value) => updateSetting('date_of_birth', value)}
          required
          error={getFieldError('date_of_birth')}
          // helperText={`Must be at least ${MINIMUM_AGE} years old`}
        />
      </div>

      <div className="space-y-6">
        <NumberField
          label="Height (cm)"
          value={settings.height}
          onChange={(value) => updateSetting('height', value)}
          min={120}
          max={250}
          step={1}
          unit="cm"
          error={getFieldError('height')}
        />

        <NumberField
          label="Weight (kg)"
          value={settings.weight}
          onChange={(value) => updateSetting('weight', value)}
          min={30}
          max={300}
          step={0.1}
          unit="kg"
          error={getFieldError('weight')}
        />

        <SelectField
          label="Gender"
          value={settings.gender || 'male'}
          onChange={(value) => updateSetting('gender', value as 'male' | 'female')}
          options={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' }
          ]}
          error={getFieldError('gender')}
          required
        />

        <SelectField
          label="Activity Level"
          value={settings.activity_level || 1}
          onChange={(value) => updateSetting('activity_level', Number(value))}
          options={getActivityLevelOptions().map((level, index) => ({
            value: index + 1,
            label: level.label
          }))}
          error={getFieldError('activity_level')}
          required
        />
      </div>
    </div>
  );
}

export default memo(ProfileForm);

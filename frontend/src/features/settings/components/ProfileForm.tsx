import { useEffect } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import type { UserDetailsResponse } from "@/api/user";
import DateField from "@/components/form/DateField";
import Dropdown from "@/components/form/Dropdown";
import HeightField from "@/components/form/HeightField";
import TextField from "@/components/form/TextField";
import WeightField from "@/components/form/WeightField";
import { Button } from "@/components/ui";
import Panel from "@/components/ui/Panel";
import { useSaveSettings } from "@/hooks/queries/useSettings";
import { useStore as useAppStore } from "@/store/store";
import { type Gender } from "@/types/user";
import type { UnitSystem } from "@/utils/unitConversion";
import {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
  UNIT_SYSTEM_OPTIONS,
} from "@/utils/userConstants";

import { validateSettingsComplete } from "../utils/validation";

interface ProfileFormProps {
  settings: UserDetailsResponse;
  onHasChangesChange: (hasChanges: boolean) => void;
}

function getActivityLevelOptions() {
  return Object.entries(ACTIVITY_LEVELS).map(([key, { label }]) => ({
    value: Number(key), // Use numeric keys for values
    label,
  }));
}

// Zero or negative reads as an empty field.
const positiveOrUndefined = (value: number | undefined) =>
  value && value > 0 ? value : undefined;

export default function ProfileForm({
  settings,
  onHasChangesChange,
}: ProfileFormProps) {
  const { showNotification } = useAppStore();
  const saveSettingsMutation = useSaveSettings();

  const form = useForm({
    defaultValues: {
      firstName: settings.firstName,
      lastName: settings.lastName,
      email: settings.email,
      dateOfBirth: settings.dateOfBirth,
      gender: settings.gender as Gender | undefined,
      unitSystem: settings.unitSystem as UnitSystem | undefined,
      height: settings.height,
      weight: settings.weight,
      activityLevel: settings.activityLevel,
    },
    validators: {
      onChange: ({ value }) => {
        const errors = validateSettingsComplete({
          ...value,
          id: settings.id,
          gender: value.gender === "" ? undefined : value.gender,
        });

        return Object.keys(errors).length > 0 ? { fields: errors } : undefined;
      },
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        await saveSettingsMutation.mutateAsync({
          ...value,
          gender: value.gender === "" ? undefined : value.gender,
        });
        formApi.reset(value);
        showNotification("Settings saved", "success");
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        showNotification(`Failed to save settings: ${errorMessage}`, "error");
      }
    },
  });
  const unitSystem =
    useStore(form.store, (state) => state.values.unitSystem) ?? "metric";
  const hasChanges = !useStore(form.store, (state) => state.isDefaultValue);
  const isValid = useStore(form.store, (state) => state.isValid);

  useEffect(() => {
    onHasChangesChange(hasChanges);
  }, [hasChanges, onHasChangesChange]);

  return (
    <Panel padding="none">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
      >
        <div className="space-y-4 p-4 sm:space-y-5 sm:p-6">
        <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
          <form.Field name="firstName">
            {(field) => (
              <TextField
                label="First Name"
                value={field.state.value}
                onChange={field.handleChange}
                error={field.state.meta.errors[0]}
                required
              />
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <TextField
                label="Last Name"
                value={field.state.value}
                onChange={field.handleChange}
                error={field.state.meta.errors[0]}
                required
              />
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <TextField
                label="Email"
                value={field.state.value}
                type="email"
                onChange={field.handleChange}
                error={field.state.meta.errors[0]}
                required
              />
            )}
          </form.Field>

          <form.Field name="dateOfBirth">
            {(field) => (
              <DateField
                label="Date of Birth"
                value={field.state.value ?? ""}
                onChange={field.handleChange}
                error={field.state.meta.errors[0]}
                required
              />
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <Dropdown
                label="Gender"
                value={field.state.value ?? ""}
                onChange={(value) => field.handleChange(value as Gender)}
                options={GENDER_OPTIONS}
                error={field.state.meta.errors[0]}
                required
              />
            )}
          </form.Field>

          <form.Field name="unitSystem">
            {(field) => (
              <Dropdown
                label="Units"
                value={unitSystem}
                onChange={(value) => field.handleChange(value as UnitSystem)}
                options={UNIT_SYSTEM_OPTIONS}
              />
            )}
          </form.Field>

          <form.Field name="height">
            {(field) => (
              <HeightField
                label="Height"
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(positiveOrUndefined(value))
                }
                error={field.state.meta.errors[0]}
                unitSystem={unitSystem}
                min={100}
                max={250}
                required
              />
            )}
          </form.Field>

          <form.Field name="weight">
            {(field) => (
              <WeightField
                label="Weight"
                value={field.state.value}
                onChange={(value) =>
                  field.handleChange(positiveOrUndefined(value))
                }
                error={field.state.meta.errors[0]}
                unitSystem={unitSystem}
                minKg={30}
                maxKg={300}
                required
              />
            )}
          </form.Field>

          <form.Field name="activityLevel">
            {(field) => (
              <Dropdown
                label="Activity Level"
                value={field.state.value ?? ""}
                onChange={(value) =>
                  field.handleChange(value ? Number(value) : undefined)
                }
                options={getActivityLevelOptions()}
                error={field.state.meta.errors[0]}
                placeholder="Select activity level"
                required
              />
            )}
          </form.Field>
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
            isLoading={saveSettingsMutation.isPending}
            disabled={!hasChanges || !isValid}
            text="Save changes"
            buttonSize="md"
            variant="primary"
          />
        </div>
      </form>
    </Panel>
  );
}

import { useState } from "react";
import { useForm, useStore } from "@tanstack/react-form";

import CardContainer from "@/components/form/CardContainer";
import TextField from "@/components/form/TextField";
import { Button } from "@/components/ui";
import { useMutationErrorHandler } from "@/hooks";
import { useChangePassword } from "@/hooks/auth/useAuthQueries";
import { useStore as useAppStore } from "@/store/store";

const passwordRequirements = (password: string) => [
  { met: password.length >= 8, text: "At least 8 characters" },
  { met: /[A-Z]/.test(password), text: "One uppercase letter" },
  { met: /[a-z]/.test(password), text: "One lowercase letter" },
  { met: /\d/.test(password), text: "One number" },
];

const strengthOf = (password: string) =>
  passwordRequirements(password).filter((request) => request.met).length;

const ChangePasswordForm = () => {
  const { showNotification } = useAppStore();
  const changePasswordMutation = useChangePassword();

  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => {
        setFormError(message);
        showNotification(message, "error");
      },
      onSuccess: (message) => {
        showNotification(message, "success");
      },
    });

  const [formError, setFormError] = useState<string | undefined>();

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    onSubmit: async ({ value, formApi }) => {
      try {
        await changePasswordMutation.mutateAsync({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        handleMutationSuccess("Password changed successfully.");
        formApi.reset();
      } catch (error) {
        handleMutationError(error, "changing password");
      }
    },
  });
  const { currentPassword, newPassword, confirmPassword } = useStore(
    form.store,
    (state) => state.values,
  );
  const passwordStrength = strengthOf(newPassword);

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return "bg-error";
    if (passwordStrength <= 2) return "bg-warning";
    if (passwordStrength <= 3) return "bg-primary";

    return "bg-success";
  };

  const getStrengthLabel = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 2) return "Fair";
    if (passwordStrength <= 3) return "Good";

    return "Strong";
  };

  return (
    <CardContainer className="p-3.5 sm:p-6">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setFormError(undefined);
          void form.handleSubmit();
        }}
        className="space-y-4 sm:space-y-5"
      >
        <div className="rounded-card border border-border bg-surface-2 p-3.5 sm:p-4">
          <p className="text-xs sm:text-sm text-muted">
            <strong className="text-foreground">Security note:</strong> For your
            protection, enter your current password before setting a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:gap-4">
          <form.Field
            name="currentPassword"
            validators={{
              onSubmit: ({ value }) =>
                value ? undefined : "Current password is required.",
            }}
          >
            {(field) => (
              <TextField
                label="Current Password"
                type="password"
                value={field.state.value}
                onChange={field.handleChange}
                required
                error={field.state.meta.errors[0]}
                name="currentPassword"
                autoComplete="current-password"
                helperText="Enter your current password to verify your identity"
              />
            )}
          </form.Field>

          <div className="space-y-2">
            <form.Field
              name="newPassword"
              validators={{
                onSubmit: ({ value }) =>
                  strengthOf(value) < 3
                    ? "Please choose a stronger password."
                    : undefined,
              }}
            >
              {(field) => (
                <TextField
                  label="New Password"
                  type="password"
                  value={field.state.value}
                  onChange={field.handleChange}
                  required
                  minLength={8}
                  error={field.state.meta.errors[0]}
                  name="newPassword"
                  autoComplete="new-password"
                />
              )}
            </form.Field>

            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                    <div
                      className={`h-full transition-[width,background-color] duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted">
                    {getStrengthLabel()}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {passwordRequirements(newPassword).map((request, index) => (
                    <span
                      key={index}
                      className={`text-xs ${
                        request.met ? "text-success" : "text-muted"
                      }`}
                    >
                      {request.met ? "Met" : "Not met"}: {request.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Field-level so each submit rechecks it; a form-level error here
              outlives a fix made in the new password field. */}
          <form.Field
            name="confirmPassword"
            validators={{
              onSubmit: ({ value, fieldApi }) =>
                value === fieldApi.form.getFieldValue("newPassword")
                  ? undefined
                  : "New passwords do not match.",
            }}
          >
            {(field) => (
              <TextField
                label="Confirm New Password"
                type="password"
                value={field.state.value}
                onChange={field.handleChange}
                required
                error={field.state.meta.errors[0]}
                name="confirmPassword"
                autoComplete="new-password"
                helperText="Re-enter your new password to confirm"
              />
            )}
          </form.Field>
        </div>

        {formError && (
          <div className="rounded-card border border-error/30 bg-error/10 p-3.5 sm:p-4">
            <p className="text-xs sm:text-sm text-error">{formError}</p>
          </div>
        )}

        <div className="mt-4 sm:mt-6 flex justify-end">
          <Button
            type="submit"
            isLoading={changePasswordMutation.isPending}
            disabled={
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              passwordStrength < 3
            }
            text="Change Password"
            buttonSize="md"
            variant="primary"
            className="w-full sm:w-auto"
          />
        </div>
      </form>
    </CardContainer>
  );
};

export default ChangePasswordForm;

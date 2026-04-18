import { useState } from "react";
import { useUser } from "@clerk/clerk-react";

import CardContainer from "@/components/form/CardContainer";
import TextField from "@/components/form/TextField";
import { Button, LockIcon } from "@/components/ui";
import { useMutationErrorHandler } from "@/hooks";
import { useStore } from "@/store/store";

const ChangePasswordForm = () => {
  const { showNotification } = useStore();
  const { user, isLoaded } = useUser();

  // Use new mutation error handling
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

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user has password authentication enabled
  const hasPassword = user?.passwordEnabled ?? false;

  // Password strength requirements
  const passwordRequirements = [
    { met: newPassword.length >= 8, text: "At least 8 characters" },
    { met: /[A-Z]/.test(newPassword), text: "One uppercase letter" },
    { met: /[a-z]/.test(newPassword), text: "One lowercase letter" },
    { met: /\d/.test(newPassword), text: "One number" },
  ];

  const passwordStrength = passwordRequirements.filter((r) => r.met).length;

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      showNotification("New passwords do not match.", "error");

      return;
    }

    // Validate password strength
    if (passwordStrength < 3) {
      setFormError("Please choose a stronger password.");
      showNotification("Please choose a stronger password.", "error");

      return;
    }

    // Validate current password is provided
    if (!currentPassword) {
      setFormError("Current password is required.");
      showNotification("Current password is required.", "error");

      return;
    }

    if (!user) {
      showNotification("User not authenticated.", "error");

      return;
    }

    setIsSubmitting(true);

    try {
      // Use Clerk's updatePassword method
      // This verifies the current password and sets the new one
      await user.updatePassword({
        currentPassword,
        newPassword,
      });

      handleMutationSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error_) {
      const error = error_;
      // Handle specific Clerk errors
      let errorMessage = "Failed to change password";

      if (error && typeof error === "object" && "errors" in error) {
        const clerkError = error as {
          errors: Array<{ code?: string; message?: string }>;
        };
        const firstError = clerkError.errors[0];

        switch (firstError.code) {
          case "form_password_incorrect": {
            errorMessage = "Current password is incorrect.";

            break;
          }
          case "form_password_not_strong_enough": {
            errorMessage = "New password is not strong enough.";

            break;
          }
          case "form_password_same_as_current": {
            errorMessage =
              "New password must be different from your current password.";

            break;
          }
          default: {
            if (firstError.message) {
              errorMessage = firstError.message;
            }
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      handleMutationError(new Error(errorMessage), "changing password");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show message for OAuth-only users
  if (isLoaded && !hasPassword) {
    return (
      <CardContainer className="p-6 sm:p-8">
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center">
            <div className="mr-4 rounded-xl bg-vibrant-accent/10 p-3">
              <LockIcon className="h-7 w-7 shrink-0 text-vibrant-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold text-foreground">
                Security Settings
              </h3>
              <p className="mt-1 text-sm text-muted">
                Password settings for your account
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
          <LockIcon className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h4 className="mb-2 text-lg font-semibold text-foreground">
            Password Not Set
          </h4>
          <p className="mb-4 text-muted">
            You signed up using a social provider (Google, Facebook, or Apple).
            You can add a password to your account for additional sign-in
            options.
          </p>
          <p className="text-sm text-muted">
            Visit the Connected Accounts section to manage your sign-in methods.
          </p>
        </div>
      </CardContainer>
    );
  }

  if (!isLoaded) {
    return (
      <CardContainer className="p-6 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-surface-3" />
          <div className="h-12 rounded-lg bg-surface-3" />
          <div className="h-12 rounded-lg bg-surface-3" />
        </div>
      </CardContainer>
    );
  }

  return (
    <CardContainer className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header section */}
        <div className="mb-8 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="flex items-center">
            <div className="mr-4 rounded-xl bg-vibrant-accent/10 p-3">
              <LockIcon className="h-7 w-7 shrink-0 text-vibrant-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-semibold text-foreground">
                Security Settings
              </h3>
              <p className="mt-1 text-sm text-muted">
                Update your password to keep your account secure
              </p>
            </div>
          </div>
        </div>

        {/* Security info */}
        <div className="rounded-2xl border border-border/60 bg-surface-2 p-5">
          <p className="text-sm text-muted">
            <strong className="text-foreground">Security note:</strong> For your
            protection, you must enter your current password to set a new one.
            This prevents unauthorized changes if your session is left
            unattended.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Current Password */}
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
            name="currentPassword"
            autoComplete="current-password"
            helperText="Enter your current password to verify your identity"
          />

          {/* New Password */}
          <div className="space-y-2">
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              required
              minLength={8}
              name="newPassword"
              autoComplete="new-password"
            />

            {/* Password strength indicator */}
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
                  {passwordRequirements.map((request, index) => (
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

          {/* Confirm New Password */}
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            error={formError?.includes("match") ? formError : undefined}
            name="confirmPassword"
            autoComplete="new-password"
            helperText="Re-enter your new password to confirm"
          />
        </div>

        {/* Error message */}
        {formError && !formError.includes("match") && (
          <div className="rounded-2xl border border-error/30 bg-error/10 p-5">
            <p className="text-sm text-error">{formError}</p>
          </div>
        )}

        {/* Submit button */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={
              !currentPassword ||
              !newPassword ||
              !confirmPassword ||
              passwordStrength < 3
            }
            text="Change Password"
            buttonSize="lg"
            variant="primary"
            className="px-8 py-3 text-lg"
          />
        </div>
      </form>
    </CardContainer>
  );
};

export default ChangePasswordForm;

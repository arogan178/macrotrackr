import { useState } from "react";

import { CardContainer, TextField } from "@/components/form";
import { Button, LockIcon } from "@/components/ui";
import { useMutationErrorHandler } from "@/hooks";
// Notifications are handled by the global NotificationManager and store
import { useChangePassword } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

const ChangePasswordForm = () => {
  const { showNotification } = useStore();
  const changePasswordMutation = useChangePassword();

  // Use new mutation error handling
  const { handleMutationError, handleMutationSuccess } =
    useMutationErrorHandler({
      onError: (message) => {
        setFormError(message);
        showNotification(message, "error");
      },
      onSuccess: (message) => {
        setSuccessMessage(message);
        showNotification(message, "success");
      },
    });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(undefined);

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters long.");
      return;
    }

    try {
      await changePasswordMutation.mutateAsync({
        currentPassword,
        newPassword,
      });
      handleMutationSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      handleMutationError(error, "changing password");
    }
  };

  return (
    <CardContainer className="p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header section to match ProfileForm pattern */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-red-400/20 to-red-500/20 rounded-xl mr-4">
              <LockIcon className="w-7 h-7 text-vibrant-accent flex-shrink-0" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-xl font-bold text-foreground truncate">
                Security Settings
              </h3>
              <p className="text-sm text-foreground mt-1">
                Update your password to keep your account secure
              </p>
            </div>
          </div>
        </div>

        {/* Success notifications are now handled by the global NotificationManager */}

        <div className="grid grid-cols-1 gap-6">
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            required
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={setNewPassword}
            required
            minLength={8}
            helperText="Password must be at least 8 characters long."
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            error={formError ?? undefined}
          />
        </div>

        {/* Submit button section */}
        <div className="mt-8 flex justify-end">
          <Button
            type="submit"
            isLoading={changePasswordMutation.isPending}
            disabled={!currentPassword || !newPassword || !confirmPassword}
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

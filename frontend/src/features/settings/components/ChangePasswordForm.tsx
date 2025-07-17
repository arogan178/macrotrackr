import { useState } from "react";

import { CardContainer, FormButton, TextField } from "@/components/form";
import { FloatingNotification } from "@/features/notifications/components";
import { useChangePassword } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

const ChangePasswordForm = () => {
  const { showNotification } = useStore();
  const changePasswordMutation = useChangePassword();

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
      setSuccessMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to change password.";
      showNotification(errorMessage, "error");
    }
  };

  return (
    <>
      <CardContainer className="p-6">
        <div className="relative">
          {successMessage && (
            <FloatingNotification
              message={successMessage}
              type="success"
              onClose={() => setSuccessMessage(undefined)}
            />
          )}
          <form
            id="change-password-form"
            onSubmit={handleSubmit}
            className="space-y-6 p-6"
          >
            <h2 className="text-2xl font-semibold text-white">
              Change Password
            </h2>
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
          </form>
        </div>
      </CardContainer>
      <div className="flex justify-end pt-4">
        <FormButton
          form="change-password-form"
          type="submit"
          isLoading={changePasswordMutation.isPending}
          disabled={!currentPassword || !newPassword || !confirmPassword}
          text="Change Password"
          buttonSize="lg"
          variant="primary"
          className="px-8 py-3 text-lg"
        />
      </div>
    </>
  );
};

export default ChangePasswordForm;

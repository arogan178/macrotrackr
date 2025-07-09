import { useState } from "react";
import { useStore } from "@/store/store";
import { FormButton, CardContainer, TextField } from "@/components/form";
import { FloatingNotification } from "@/features/notifications/components";

const ChangePasswordForm = () => {
  const changePassword = useStore((state) => state.changePassword);
  const isChangingPassword = useStore((state) => state.auth.isChangingPassword);
  const changePasswordError = useStore(
    (state) => state.auth.changePasswordError
  );
  const changePasswordSuccess = useStore(
    (state) => state.auth.changePasswordSuccess
  );
  const clearChangePasswordMessages = useStore(
    (state) => state.clearChangePasswordMessages
  );

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (newPassword !== confirmPassword) {
      setFormError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setFormError("New password must be at least 8 characters long.");
      return;
    }

    await changePassword(currentPassword, newPassword);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <>
      <CardContainer className="p-6">
        <div className="relative">
          {changePasswordSuccess && (
            <FloatingNotification
              message={changePasswordSuccess}
              type="success"
              onClose={clearChangePasswordMessages}
            />
          )}
          {changePasswordError && (
            <FloatingNotification
              message={changePasswordError}
              type="error"
              onClose={clearChangePasswordMessages}
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
          isLoading={isChangingPassword}
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

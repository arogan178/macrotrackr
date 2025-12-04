import { useSearch } from "@tanstack/react-router";
import { useState } from "react";

import { resetPasswordRoute } from "@/AppRouter";
import { CardContainer, TextField } from "@/components/form";
import { Button, LoadingSpinner, LockIcon } from "@/components/ui";
import { useResetPassword } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";
import { ApiError } from "@/utils/apiServices";

function ResetPasswordForm() {
  const search = useSearch({ from: resetPasswordRoute.id });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { showNotification } = useStore();
  const resetPasswordMutation = useResetPassword();

  // useSearch can be untyped in some setups; cast to any for token access
  const token = (search as any)?.token as string | undefined;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) {
      showNotification("No reset token found.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }
    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });
      showNotification("Password has been reset successfully.", "success");
    } catch (error) {
      if (error instanceof ApiError) {
        showNotification(error.message || "Reset failed", "error");
      } else if (error instanceof Error) {
        showNotification(error.message || "Reset failed", "error");
      } else {
        showNotification("An unexpected error occurred.", "error");
      }
    }
  }

  const passwordsMatch =
    newPassword === confirmPassword && newPassword.length > 0;

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <LockIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
        <p className="mt-2 text-muted">Enter your new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="New Password"
          value={newPassword}
          onChange={setNewPassword}
          type="password"
          required={true}
          placeholder="••••••••"
        />

        <TextField
          label="Confirm New Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          required={true}
          placeholder="••••••••"
        />

        {confirmPassword.length > 0 && !passwordsMatch && (
          <p className="text-sm text-red-500">Passwords do not match</p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            resetPasswordMutation.isPending ||
            !token ||
            !newPassword ||
            !confirmPassword ||
            !passwordsMatch
          }
        >
          {resetPasswordMutation.isPending ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            "Reset Password"
          )}
        </Button>
      </form>
    </CardContainer>
  );
}

export default ResetPasswordForm;

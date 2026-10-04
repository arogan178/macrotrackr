import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useSearch } from "@tanstack/react-router";

import { ApiError } from "@/api/core";
import CardContainer from "@/components/form/CardContainer";
import TextField from "@/components/form/TextField";
import { Button, LoadingSpinner, LockIcon } from "@/components/ui";
import { useResetPassword } from "@/hooks/auth/useAuthQueries";
import { useStore } from "@/store/store";

function checkPasswords({
  value,
}: {
  value: { newPassword: string; confirmPassword: string };
}) {
  // Silent until there is a confirmation to disagree with.
  if (value.confirmPassword && value.newPassword !== value.confirmPassword) {
    return { fields: { confirmPassword: "Passwords do not match" } };
  }
  // Never shown; it keeps the button disabled until both are filled in.
  if (!value.newPassword || !value.confirmPassword) {
    return "Enter and confirm your new password";
  }

  return undefined;
}

function ResetPasswordForm() {
  const search = (useSearch({ strict: false }) ?? {}) as { token?: string };
  const { showNotification } = useStore();
  const resetPasswordMutation = useResetPassword();

  // Extract token from search params with proper typing
  const token = search.token;

  const form = useForm({
    defaultValues: { newPassword: "", confirmPassword: "" },
    // onMount keeps the button disabled before anything is typed.
    validators: { onMount: checkPasswords, onChange: checkPasswords },
    onSubmit: async ({ value: { newPassword } }) => {
      if (!token) {
        showNotification("No reset token found.", "error");

        return;
      }
      try {
        await resetPasswordMutation.mutateAsync({ token, newPassword });
        showNotification("Password has been reset successfully.", "success");
      } catch (error) {
        if (error instanceof ApiError) {
          showNotification(error.message ?? "Reset failed", "error");
        } else if (error instanceof Error) {
          showNotification(error.message ?? "Reset failed", "error");
        } else {
          showNotification("An unexpected error occurred.", "error");
        }
      }
    },
  });
  const canSubmit = useFormStore(form.store, (state) => state.canSubmit);

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <LockIcon className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Reset Password</h1>
        <p className="mt-2 text-muted">Enter your new password</p>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-5"
      >
        <form.Field name="newPassword">
          {(field) => (
            <TextField
              label="New Password"
              value={field.state.value}
              onChange={field.handleChange}
              type="password"
              required
              placeholder="••••••••"
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <TextField
              label="Confirm New Password"
              value={field.state.value}
              onChange={field.handleChange}
              type="password"
              required
              placeholder="••••••••"
              error={field.state.meta.errors[0]}
            />
          )}
        </form.Field>

        <Button
          type="submit"
          className="w-full"
          disabled={resetPasswordMutation.isPending || !token || !canSubmit}
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

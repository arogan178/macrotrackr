import { useState } from "react";
import { useForm, useStore as useFormStore } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { authApi } from "@/api/auth";
import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { BiometricOptInCheckbox } from "@/features/auth/components/BiometricOptInCheckbox";
import { BiometricSignInButton } from "@/features/auth/components/BiometricSignInButton";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { queryKeys } from "@/lib/queryKeys";
import { saveBiometricCredentials } from "@/services/biometrics";
import { useStore } from "@/store/store";

interface LocalSignInFormProps {
  onSwitchToSignUp: () => void;
  redirectTo?: string;
}

export function LocalSignInForm({
  onSwitchToSignUp,
  redirectTo,
}: LocalSignInFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showNotification } = useStore();

  const [isSendingReset, setIsSendingReset] = useState(false);

  const form = useForm({
    defaultValues: { email: "", password: "", enableBiometrics: false },
    onSubmit: async ({ value: { email, password, enableBiometrics } }) => {
      try {
        const normalizedEmail = email.trim().toLowerCase();
        await authApi.login({
          email: normalizedEmail,
          password,
        });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.auth.session(),
        });
        // Save credentials for Biometric sign-in on future app launches,
        // only when the user explicitly opted in
        if (enableBiometrics) {
          await saveBiometricCredentials(normalizedEmail, password);
        }
        showNotification("Signed in successfully!", "success");

        const destination = normalizeAuthRedirect(redirectTo);
        if (destination === "/home") {
          navigate({
            to: "/home",
            search: { limit: 20, offset: 0 },
            replace: true,
          });
        } else {
          navigate({
            to: destination as any,
            replace: true,
          });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid email or password.";
        showNotification(message, "error");
      }
    },
  });
  const isSubmitting = useFormStore(form.store, (state) => state.isSubmitting);

  async function handleForgotPassword() {
    const normalizedEmail = form.getFieldValue("email").trim().toLowerCase();
    if (!normalizedEmail) {
      showNotification(
        "Enter your email first to request a reset link.",
        "info",
      );

      return;
    }

    setIsSendingReset(true);
    try {
      await authApi.forgotPassword({ email: normalizedEmail });
      showNotification(
        "If this email exists, a password reset link has been sent.",
        "success",
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not request a password reset.";
      showNotification(message, "error");
    } finally {
      setIsSendingReset(false);
    }
  }

  return (
    <div className="w-full">
      <BiometricSignInButton redirectTo={redirectTo} />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void form.handleSubmit();
        }}
        className="space-y-4"
      >
        <form.Field name="email">
          {(field) => (
            <TextField
              label="Email"
              value={field.state.value}
              onChange={field.handleChange}
              type="email"
              required
              placeholder="your@email.com"
              name="email"
              autoComplete="username"
            />
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <TextField
              label="Password"
              value={field.state.value}
              onChange={field.handleChange}
              type="password"
              required
              placeholder="••••••••"
              name="password"
              autoComplete="current-password"
            />
          )}
        </form.Field>

        <form.Field name="enableBiometrics">
          {(field) => (
            <BiometricOptInCheckbox
              checked={field.state.value}
              onChange={field.handleChange}
            />
          )}
        </form.Field>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isSendingReset}
            className="inline-flex min-h-11 items-center rounded-control px-2 py-2 text-sm text-primary transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
          >
            {isSendingReset ? "Sending..." : "Forgot password?"}
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isSubmitting}
          loadingText="Signing in..."
        >
          Sign In
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Don&apos;t have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="inline-flex min-h-11 items-center rounded-control px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

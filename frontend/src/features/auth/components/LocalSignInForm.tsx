import { useState } from "react";

import { authApi } from "@/api/auth";
import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { useStore } from "@/store/store";

interface LocalSignInFormProps {
  onSwitchToSignUp: () => void;
  redirectTo?: string;
}

export function LocalSignInForm({
  onSwitchToSignUp,
  redirectTo,
}: LocalSignInFormProps) {
  const { showNotification } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      await authApi.login({
        email: email.trim().toLowerCase(),
        password,
      });
      showNotification("Signed in successfully!", "success");
      globalThis.location.assign(normalizeAuthRedirect(redirectTo));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid email or password.";
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleForgotPassword() {
    const normalizedEmail = email.trim().toLowerCase();
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
          placeholder="your@email.com"
          name="email"
          autoComplete="username"
        />

        <TextField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          required
          placeholder="••••••••"
          name="password"
          autoComplete="current-password"
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={isSendingReset}
            className="inline-flex min-h-11 items-center rounded-md px-2 py-2 text-sm text-primary transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none disabled:opacity-60"
          >
            {isSendingReset ? "Sending..." : "Forgot password?"}
          </button>
        </div>

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
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
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign up
        </button>
      </div>
    </div>
  );
}

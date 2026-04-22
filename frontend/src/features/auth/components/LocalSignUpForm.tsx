import { useState } from "react";

import { authApi } from "@/api/auth";
import TextField from "@/components/form/TextField";
import Button from "@/components/ui/Button";
import { normalizeAuthRedirect } from "@/features/auth/utils/redirect";
import { useStore } from "@/store/store";

interface LocalSignUpFormProps {
  onSwitchToSignIn: () => void;
  redirectTo?: string;
}

export function LocalSignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: LocalSignUpFormProps) {
  const { showNotification } = useStore();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (password !== confirmPassword) {
      showNotification("Passwords do not match.", "error");

      return;
    }

    setIsLoading(true);
    try {
      await authApi.register({
        email: email.trim().toLowerCase(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      showNotification("Account created successfully!", "success");
      globalThis.location.assign(normalizeAuthRedirect(redirectTo));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create account. Please try again.";
      showNotification(message, "error");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label="First Name"
            value={firstName}
            onChange={setFirstName}
            required
            placeholder="John"
            textOnly
            name="firstName"
            autoComplete="given-name"
          />
          <TextField
            label="Last Name"
            value={lastName}
            onChange={setLastName}
            required
            placeholder="Doe"
            textOnly
            name="lastName"
            autoComplete="family-name"
          />
        </div>

        <TextField
          label="Email"
          value={email}
          onChange={setEmail}
          type="email"
          required
          placeholder="your@email.com"
          name="email"
          autoComplete="email"
        />

        <TextField
          label="Password"
          value={password}
          onChange={setPassword}
          type="password"
          required
          placeholder="••••••••"
          name="password"
          autoComplete="new-password"
        />

        <TextField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          type="password"
          required
          placeholder="••••••••"
          name="confirmPassword"
          autoComplete="new-password"
        />

        <Button
          type="submit"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create Account
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-6 text-center text-sm">
        <span className="text-muted">Already have an account? </span>
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium text-primary transition-colors duration-200 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none"
        >
          Sign in
        </button>
      </div>
    </div>
  );
}

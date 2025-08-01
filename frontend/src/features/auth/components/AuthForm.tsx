import { useState } from "react";

import { TextField } from "@/components/form";
import { Button } from "@/components/ui";
// Notifications are handled by the global NotificationManager and store

type AuthMode = "login" | "register";
type AuthFormProps = {
  mode: AuthMode;
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
};

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit({ email, password });
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMessages = () => {
    setError("");
  };

  return (
    <div className="mx-auto max-w-md rounded-lg bg-surface p-6 shadow-surface">
      <h2 className="mb-6 text-center text-2xl font-bold">
        {mode === "login" ? "Login" : "Register"}
      </h2>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-error/40 bg-error/10 p-3 text-sm text-error"
        >
          <div className="flex items-start justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={handleClearMessages}
              className="text-error hover:opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          minLength={6}
        />
        <Button
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="w-full"
        >
          {mode === "login" ? "Login" : "Register"}
        </Button>
      </form>
    </div>
  );
}

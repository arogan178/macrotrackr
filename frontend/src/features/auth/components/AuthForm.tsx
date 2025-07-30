import { useEffect, useState } from "react";

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
    <div className="max-w-md mx-auto p-6 bg-surface rounded-lg shadow-surface">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {mode === "login" ? "Login" : "Register"}
      </h2>
      <FloatingNotification
        message={error}
        type="error"
        onClose={handleClearMessages}
      />
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

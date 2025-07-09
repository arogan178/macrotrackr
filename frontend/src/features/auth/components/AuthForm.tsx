import { useState } from "react";
import { FormButton, TextField } from "@/components/form";
import FloatingNotification from "@/features/notifications/components/FloatingNotification";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await onSubmit({ email, password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClearMessages = () => {
    setError("");
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
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
        <FormButton
          type="submit"
          isLoading={loading}
          disabled={loading}
          className="w-full"
        >
          {mode === "login" ? "Login" : "Register"}
        </FormButton>
      </form>
    </div>
  );
}

import { useState } from "react";
import FormButton from "@/components/form/FormButton";
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
        <div>
          <label className="block mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            required
            minLength={6}
          />
        </div>
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

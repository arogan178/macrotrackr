import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const toggleMode = () =>
    setMode((prev) => (prev === "login" ? "register" : "login"));

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);
      navigate("/home", { replace: true });
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block mb-2 text-gray-300">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div>
        <label className="block mb-2 text-gray-300">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-gray-100 focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>
      <div className="text-right">
        <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
          Forgot Password?
        </a>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Processing..." : "Login"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md">
        {error && (
          <div className="mb-4 text-red-400 bg-red-900/50 p-3 rounded">
            {error}
          </div>
        )}
        {mode === "login" ? (
          <>
            <div className="p-6 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
              <h2 className="text-2xl font-bold mb-6 text-center text-gray-100">
                Login
              </h2>
              {renderLoginForm()}
            </div>
          </>
        ) : (
          <RegisterForm />
        )}
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleMode}
            className="flex flex-col items-center space-y-1 text-blue-400 hover:text-blue-300 transition-colors"
          >
            {mode === "login" ? (
              <>
                <p className="text-sm text-gray-400">New User?</p>
                <span className="font-semibold">Register</span>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400">Already have an account?</p>
                <span className="font-semibold">Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

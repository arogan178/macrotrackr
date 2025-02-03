import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState(""); // added state for full name
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); // new state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const toggleMode = () =>
    setMode((prev) => (prev === "login" ? "register" : "login"));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      // Build payload and explicitly select the API endpoint based on mode
      const payload: { email: string; password: string; fullName?: string } = {
        email,
        password,
      };

      let apiEndpoint = "";
      if (mode === "register") {
        payload.fullName = fullName;
        apiEndpoint = "http://localhost:3000/api/auth/register";
      } else {
        apiEndpoint = "http://localhost:3000/api/auth/login";
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "An error occurred");
      }

      const { token } = await response.json();
      localStorage.setItem("token", token);
      navigate("/home", { replace: true });
      window.location.reload(); // Force reload to update authentication state
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {" "}
      {/* added container for centering */}
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === "login" ? "Login" : "Register"}
        </h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 transition-all duration-300"
        >
          {mode === "register" && (
            <div>
              <label className="block mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}
          {/* ... Email Field ... */}
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
          {/* Conditionally render Full Name for register */}

          {/* ... Password Field ... */}
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
          {mode === "register" && (
            <div>
              <label className="block mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}
          {mode === "login" && (
            <div className="text-right">
              <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                Forgot Password?
              </a>
            </div>
          )}
          {/* Slide effect placeholder: additional fields can be animated here if needed */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading
              ? "Processing..."
              : mode === "login"
              ? "Login"
              : "Register"}
          </button>
        </form>
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleMode}
            className="flex flex-col items-center space-y-1 text-blue-600 hover:text-blue-800 transition-colors"
          >
            {mode === "login" ? (
              <>
                <p className="text-sm text-gray-500">New User?</p>
                <span className="font-semibold">Register</span>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Already have an account?
                </p>
                <span className="font-semibold">Login</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

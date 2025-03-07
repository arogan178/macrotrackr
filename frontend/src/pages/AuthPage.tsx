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
    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <label className="block mb-2 text-gray-200 font-medium">Email</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
            </svg>
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 pl-10 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-100 
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                     transition-all duration-200 shadow-sm"
            required
            placeholder="your@email.com"
          />
        </div>
      </div>
      <div>
        <label className="block mb-2 text-gray-200 font-medium">Password</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pl-10 bg-gray-800/80 border border-gray-700 rounded-lg text-gray-100 
                     focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none
                     transition-all duration-200 shadow-sm"
            required
            placeholder="••••••••"
          />
        </div>
      </div>
      <div className="text-right">
        <a href="#" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
          Forgot Password?
        </a>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </span>
        ) : "Sign In"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          {/* Decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full filter blur-3xl"></div>
          <div className="absolute top-3/4 right-1/3 w-64 h-64 bg-blue-600/20 rounded-full filter blur-3xl"></div>
        </div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        {error && (
          <div className="mb-4 text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-800/50 shadow-lg animate-appear">
            <div className="flex items-center">
              <svg className="h-5 w-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              {error}
            </div>
          </div>
        )}
        {mode === "login" ? (
          <>
            <div className="p-8 bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-700/50">
              <div className="mb-8 flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10M4 7l4-2m4-2l4 2m-8 6l4 2m4-2l4-2"></path>
                  </svg>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
                  Welcome Back
                </h1>
                <p className="mt-2 text-gray-400">Sign in to track your macros</p>
              </div>
              {renderLoginForm()}
            </div>
          </>
        ) : (
          <RegisterForm />
        )}
        <div className="mt-8 flex justify-center">
          <button
            onClick={toggleMode}
            className="group flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors px-6 py-3 rounded-lg hover:bg-gray-800/30"
          >
            {mode === "login" ? (
              <>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">New User?</p>
                <span className="font-semibold flex items-center">
                  Register
                  <svg className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">Already have an account?</p>
                <span className="font-semibold flex items-center">
                  Login
                  <svg className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CardContainer, TextField } from "@/components/form";
import LoadingSpinner from "@/components/LoadingSpinner";
import { CalorieIcon } from "@/components/Icons";
import { useStore } from "@/store/store";

function FormLogin() {
  const navigate = useNavigate();
  const {
    auth: { email, password, isLoading, error },
    setAuthEmail,
    setAuthPassword,
    login,
  } = useStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        console.log("Login attempt with:", { email, password: "••••••" });
        await login(email, password);

        // Give a small delay before navigation to ensure token is properly stored
        setTimeout(() => {
          navigate("/home", { replace: true });
        }, 100);
      } catch (error) {
        console.error("Login failed:", error);
      }
    },
    [email, password, login, navigate]
  );

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <CalorieIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 text-transparent bg-clip-text">
          Welcome Back
        </h1>
        <p className="mt-2 text-gray-400">Sign in to track your macros</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField
          label="Email"
          value={email}
          onChange={setAuthEmail}
          type="email"
          required={true}
          placeholder="your@email.com"
          maxLength={30}
        />
        <TextField
          label="Password"
          value={password}
          onChange={setAuthPassword}
          type="password"
          required={true}
          placeholder="••••••••"
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <div className="text-right">
          <a
            href="#"
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Forgot Password?
          </a>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-3 rounded-lg font-medium text-white 
                 bg-gradient-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400
                 disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
                 shadow-lg shadow-indigo-500/30"
        >
          {isLoading ? <LoadingSpinner size="sm" color="white" /> : "Sign In"}
        </button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;

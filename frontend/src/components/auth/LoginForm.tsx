import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CardContainer, TextField } from "../FormComponents";
import { useAppState } from "../../store/app-state";

function FormLogin() {
  const navigate = useNavigate();
  const {
    auth: { email, password, isLoading },
    setAuthEmail,
    setAuthPassword,
    login,
  } = useAppState();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await login(email, password);
      navigate("/home", { replace: true });
      window.location.reload();
    },
    [email, password, login, navigate]
  );

  return (
    <CardContainer className="p-8">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-600 to-blue-500 mb-4 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg
            className="w-8 h-8 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10M4 7l4-2m4-2l4 2m-8 6l4 2m4-2l4-2"
            ></path>
          </svg>
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
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </CardContainer>
  );
}

export default FormLogin;

import React from "react";

interface ButtonModeToggleProps {
  mode: "login" | "register";
  onToggle: () => void;
}

function ButtonModeToggle({ mode, onToggle }: ButtonModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="group flex flex-col items-center space-y-1 text-gray-300 hover:text-white transition-colors px-6 py-3 rounded-lg hover:bg-gray-800/30"
    >
      {mode === "login" ? (
        <>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            New User?
          </p>
          <span className="font-semibold flex items-center">
            Register
            <svg
              className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              ></path>
            </svg>
          </span>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
            Already have an account?
          </p>
          <span className="font-semibold flex items-center">
            Login
            <svg
              className="ml-1 h-4 w-4 transform transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              ></path>
            </svg>
          </span>
        </>
      )}
    </button>
  );
}

export default ButtonModeToggle;

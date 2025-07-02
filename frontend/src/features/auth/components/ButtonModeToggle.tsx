import { ForwardIcon } from "@/components/Icons";

interface ButtonModeToggleProps {
  mode: "login" | "register";
  onToggle: () => void;
}

function ButtonModeToggle({ mode, onToggle }: ButtonModeToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="group flex flex-col items-center text-gray-300 hover:text-white transition-colors px-6 py-3 rounded-lg hover:bg-gray-800/30"
    >
      <div className="text-center">
        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
          {mode === "login" ? "New User?" : "Already have an account?"}
        </p>
        <div className="flex items-center justify-center mt-1">
          <span className="font-semibold">
            {mode === "login" ? "Register" : "Login"}
          </span>
          <ForwardIcon />
        </div>
      </div>
    </button>
  );
}

export default ButtonModeToggle;

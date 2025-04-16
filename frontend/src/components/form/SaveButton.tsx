import { memo } from "react";
import { LoadingSpinnerIcon } from "../Icons";
import { SaveButtonProps } from "../utils/types";

function SaveButton({
  onClick,
  loading = false,
  disabled = false,
  children = "Save Changes",
}: SaveButtonProps) {
  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={loading || disabled}
      className="px-8 py-3 rounded-lg font-semibold text-white text-lg
              bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600 
              hover:from-indigo-400 hover:via-blue-400 hover:to-indigo-500
              disabled:opacity-50 transition-all duration-300 transform hover:scale-[1.02]
              shadow-lg shadow-indigo-500/30 relative overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r 
              before:from-transparent before:via-white/10 before:to-transparent
              before:translate-x-[-200%] hover:before:translate-x-[200%]
              before:transition-transform before:duration-1000"
      aria-busy={loading}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <LoadingSpinnerIcon className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
          Saving...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default memo(SaveButton);

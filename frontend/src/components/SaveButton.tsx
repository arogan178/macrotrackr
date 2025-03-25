import { ReactNode } from "react";

interface SaveButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}

export default function SaveButton({ 
  onClick, 
  loading = false, 
  disabled = false, 
  children = "Save Changes" 
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
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Saving...
        </span>
      ) : children}
    </button>
  );
}
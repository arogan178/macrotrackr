import { ReactNode } from "react";

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}

function TabButton({ active, onClick, children }: TabButtonProps) {
  const baseStyles =
    "px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800";

  const activeStyles = "bg-indigo-600 text-white shadow-md";
  const inactiveStyles = "text-gray-300 hover:bg-gray-700/50 hover:text-white";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${active ? activeStyles : inactiveStyles}`}
      aria-selected={active}
      role="tab"
    >
      {children}
    </button>
  );
}

export default TabButton;

import { TabButtonProps } from "./types";
import { formStyles } from "./styles";

export function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${formStyles.tab.base} ${
        active ? formStyles.tab.active : formStyles.tab.inactive
      }`}
    >
      {children}
    </button>
  );
}

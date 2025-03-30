import { memo } from "react";
import { TabButtonProps } from "../utils/types";
import { formStyles } from "../utils/styles";

function TabButton({ active, onClick, children }: TabButtonProps) {
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

export default memo(TabButton);

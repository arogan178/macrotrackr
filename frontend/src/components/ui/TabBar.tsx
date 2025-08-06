import React from "react";

import { BUTTON_SIZES } from "@/components/utils/Constants";

import TabButton from "./TabButton";

export type TabItem = {
  key: string;
  label: React.ReactNode;
  activeBg?: string;
  disabled?: boolean;
};

type ButtonSizeKey = keyof typeof BUTTON_SIZES; // "xs" | "sm" | "md" | "lg"

export interface TabBarProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  layoutId?: string;
  isMotion?: boolean;
  rounded?: string;
  className?: string;
  size?: ButtonSizeKey; // aligns TabBar with BUTTON_SIZES
}

function TabBar({
  items,
  activeKey,
  onChange,
  layoutId = "tabbar-highlight",
  isMotion = true,
  rounded = "rounded-md",
  className = "",
  size = "md",
}: TabBarProps) {
  return (
    <div
      role="tablist"
      className={`relative flex flex-wrap space-x-1 bg-surface-2 p-0.5 ${rounded} ${className}`}
    >
      {items.map((item) => (
        <TabButton
          key={item.key}
          active={activeKey === item.key}
          onClick={() => onChange(item.key)}
          layoutId={layoutId}
          isMotion={isMotion}
          rounded={rounded}
          activeBg={item.activeBg}
          disabled={item.disabled}
          aria-selected={activeKey === item.key}
          role="tab"
          size={size}
        >
          {item.label}
        </TabButton>
      ))}
    </div>
  );
}

export default TabBar;

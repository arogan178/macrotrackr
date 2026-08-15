import React from "react";

import { BUTTON_SIZES } from "@/components/utils/UiConstants";
import { cn } from "@/lib/classnameUtilities";

import TabButton from "./TabButton";

export interface TabItem {
  key: string;
  label: React.ReactNode;
  activeBg?: string;
  disabled?: boolean;
}

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
  ariaLabel?: string;
  /** Below `sm`, spread the tabs across the full width instead of scrolling. */
  fullWidth?: boolean;
}

function TabBar({
  items,
  activeKey,
  onChange,
  layoutId = "tabbar-highlight",
  isMotion = true,
  rounded = "rounded-card",
  className = "",
  size = "md",
  ariaLabel,
  fullWidth = false,
}: TabBarProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "relative items-center gap-1 border border-border bg-surface-2 p-1",
        rounded,
        fullWidth ? "flex w-full sm:inline-flex sm:w-auto" : "inline-flex flex-wrap",
        className,
      )}
    >
      {items.map((item) => (
        <TabButton
          key={item.key}
          active={activeKey === item.key}
          onClick={() => onChange(item.key)}
          layoutId={layoutId}
          isMotion={isMotion}
          rounded="rounded-control"
          activeBg={item.activeBg}
          disabled={item.disabled}
          aria-selected={activeKey === item.key}
          role="tab"
          size={size}
          fullWidth={fullWidth}
        >
          {item.label}
        </TabButton>
      ))}
    </div>
  );
}

export default TabBar;

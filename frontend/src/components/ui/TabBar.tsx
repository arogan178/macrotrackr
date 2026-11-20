import React, { useRef, useState } from "react";

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
  /** Below `sm`, spread the tabs across the full width, scrolling if they still do not fit. */
  fullWidth?: boolean;
  /** When true, arrow keys move focus without calling onChange until Enter/Space/click. */
  manualActivation?: boolean;
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
  manualActivation = false,
}: TabBarProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const tabStopKey =
    focusedKey && items.some((item) => item.key === focusedKey && !item.disabled)
      ? focusedKey
      : activeKey;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const enabledItems = items.filter((item) => !item.disabled);
    if (enabledItems.length === 0) return;

    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]:not([disabled])',
      ) ?? [],
    );
    const focusedIndex = tabs.indexOf(
      document.activeElement as HTMLButtonElement,
    );
    const currentIndex =
      focusedIndex >= 0
        ? focusedIndex
        : Math.max(
            0,
            enabledItems.findIndex((item) => item.key === activeKey),
          );
    let nextIndex: number;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % enabledItems.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = enabledItems.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextItem = enabledItems[nextIndex];
    if (!nextItem) return;

    setFocusedKey(nextItem.key);
    if (!manualActivation) {
      onChange(nextItem.key);
    }
    tabs[nextIndex]?.focus();
  };

  const handleBlur = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setFocusedKey(null);
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={cn(
        "relative items-center gap-1 border border-border bg-surface-2 p-1",
        rounded,
        fullWidth
          ? "flex w-full overflow-x-auto [scrollbar-width:none] sm:inline-flex sm:w-auto"
          : "inline-flex flex-wrap",
        className,
      )}
    >
      {items.map((item) => {
        const isActive = activeKey === item.key;

        return (
          <TabButton
            key={item.key}
            active={isActive}
            onClick={() => onChange(item.key)}
            layoutId={layoutId}
            isMotion={isMotion}
            rounded="rounded-control"
            activeBg={item.activeBg}
            disabled={item.disabled}
            aria-selected={isActive}
            tabIndex={item.key === tabStopKey ? 0 : -1}
            onFocus={() => setFocusedKey(item.key)}
            role="tab"
            size={size}
            fullWidth={fullWidth}
          >
            {item.label}
          </TabButton>
        );
      })}
    </div>
  );
}

export default TabBar;

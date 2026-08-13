import React, { useCallback } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import {
  GoalsIcon,
  HomeIcon,
  PlusIcon,
  ReportingIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { cn } from "@/lib/classnameUtilities";

const TABS = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/reporting", label: "Analytics", icon: ReportingIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

interface MobileTabBarProps {
  /** Opens the Log sheet. The primary action gets the centre position. */
  onLog: () => void;
}

/**
 * All four destinations used to sit behind a top-right hamburger — the least
 * reachable point on a phone held one-handed — and logging a meal needed a
 * scroll. This is the one structural change in the plan: destinations at the
 * bottom, primary action in the middle, clear of the home indicator.
 */
const MobileTabBar: React.FC<MobileTabBarProps> = ({ onLog }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = useCallback(
    (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  const go = useCallback(
    (path: string) => {
      navigate({ to: path });
    },
    [navigate],
  );

  const [left, right] = [TABS.slice(0, 2), TABS.slice(2)];

  const renderTab = ({
    path,
    label,
    icon: Icon,
  }: (typeof TABS)[number]) => {
    const active = isActive(path);

    return (
      <button
        key={path}
        type="button"
        onClick={() => go(path)}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-h-11 flex-1 flex-col items-center justify-center gap-1 px-1 py-1.5 text-[11px] font-medium transition-colors",
          active ? "text-foreground" : "text-muted",
        )}
      >
        <Icon className={cn("h-5 w-5", active && "text-primary")} />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-70 flex items-stretch border-t border-border bg-surface pb-[var(--sab)] lg:hidden"
    >
      {left.map(renderTab)}

      <div className="flex w-16 shrink-0 items-start justify-center">
        <button
          type="button"
          onClick={onLog}
          aria-label="Log a meal"
          className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-background transition-transform active:scale-95"
        >
          <PlusIcon className="h-6 w-6" strokeWidth={2.5} />
        </button>
      </div>

      {right.map(renderTab)}
    </nav>
  );
};

export default MobileTabBar;

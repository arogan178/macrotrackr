import React, { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { getButtonClasses } from "@/components/ui/Button";
import {
  CloseIcon,
  GoalsIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ReportingIcon,
  SettingsIcon,
} from "@/components/ui/Icons";
import { useLogout } from "@/hooks/auth/useAuthQueries";

import LogoButton from "./LogoButton";

const NAV_ITEMS_CONFIG = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/reporting", label: "Analytics", icon: ReportingIcon },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const navButtonClasses =
  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const mobileMenuButtonClasses =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const iconButtonClasses =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

interface NavItemProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  onClick: () => void;
  variant?: "desktop" | "mobile";
}

function NavItem({
  label,
  icon: Icon,
  isActive,
  onClick,
  variant = "desktop",
}: NavItemProps) {
  if (variant === "desktop") {
    const activeClasses = "bg-surface-2 text-foreground font-semibold shadow-xs";
    const inactiveClasses = "text-muted hover:bg-surface-2/60 hover:text-foreground";
    return (
      <button
        type="button"
        onClick={onClick}
        aria-current={isActive ? "page" : undefined}
        className={`${navButtonClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-muted"}`} />
        <span>{label}</span>
      </button>
    );
  }

  const activeClasses =
    "border border-primary/25 bg-primary/10 text-foreground font-semibold shadow-xs";
  const inactiveClasses =
    "border border-transparent text-muted hover:border-border/40 hover:bg-surface-2/50 hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`group ${mobileMenuButtonClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150 shrink-0 ${
            isActive
              ? "bg-primary/20 text-primary"
              : "bg-surface-2/60 text-muted group-hover:bg-surface-2 group-hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <span className="truncate text-sm">{label}</span>
      </div>
    </button>
  );
}

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: readonly {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
  isActiveRoute: (path: string) => boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
  isLoggingOut: boolean;
  shouldReduceMotion: boolean;
}

function MobileMenu({
  isOpen,
  onClose,
  navItems,
  isActiveRoute,
  onNavigate,
  onLogout,
  isLoggingOut,
  shouldReduceMotion,
}: MobileMenuProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-60 bg-black/60 lg:hidden backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            style={{ touchAction: "none", overscrollBehavior: "contain" }}
          />

          <motion.div
            className="fixed inset-x-4 top-20 z-70 rounded-2xl border border-border/80 bg-surface/98 p-2.5 shadow-2xl backdrop-blur-xl lg:hidden"
            initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.15,
              ease: "easeOut",
            }}
          >
            <div className="space-y-1">
              {navItems.map(({ path, label, icon }) => (
                <NavItem
                  key={path}
                  label={label}
                  icon={icon}
                  isActive={isActiveRoute(path)}
                  onClick={() => onNavigate(path)}
                  variant="mobile"
                />
              ))}

              <div className="mt-2 border-t border-border/50 pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  disabled={isLoggingOut}
                  className={`${mobileMenuButtonClasses} border border-transparent text-rose-400/90 hover:border-rose-500/20 hover:bg-rose-500/10 hover:text-rose-400`}
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                    <LogoutIcon className="h-4 w-4" />
                  </div>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const logoutMutation = useLogout();

  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  }, [logoutMutation]);

  const handleNavigation = useCallback(
    (path: string) => {
      navigate({ to: path });
      setIsMobileMenuOpen(false);
    },
    [navigate],
  );

  const navItems = useMemo(() => NAV_ITEMS_CONFIG, []);

  const isActiveRoute = useCallback(
    (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  return (
    <>
      <header className="fixed inset-x-0 z-70 px-4 sm:px-6 lg:px-8" style={{ top: "calc(1rem + var(--sat))" }}>
        <nav
          className="mx-auto flex min-h-14 w-full max-w-7xl items-center justify-between rounded-2xl border border-border bg-surface px-4 shadow-sm transition-colors duration-200 sm:px-6"
          role="navigation"
          aria-label="Main navigation"
          style={{ touchAction: "manipulation" }}
        >
          <div className="flex min-w-0 items-center gap-2 lg:gap-4">
            <LogoButton
              compact
              onClick={() =>
                navigate({
                  to: "/home",
                  search: { limit: 20, offset: 0 },
                })
              }
            />

            <div className="hidden items-center gap-2 lg:flex">
              {navItems.map(({ path, label, icon }) => (
                <NavItem
                  key={path}
                  label={label}
                  icon={icon}
                  isActive={isActiveRoute(path)}
                  onClick={() => handleNavigation(path)}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:flex">
              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className={getButtonClasses(
                  "ghost",
                  "sm",
                  false,
                  "min-h-11 gap-2.5 rounded-full font-medium",
                )}
              >
                <LogoutIcon className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            <motion.button
              type="button"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className={`${iconButtonClasses} lg:hidden ${
                isMobileMenuOpen ? "border-primary/40 bg-surface-2 text-foreground" : ""
              }`}
            >
              {isMobileMenuOpen ? (
                <CloseIcon className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </nav>
      </header>

      <div className="h-20" />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navItems={navItems}
        isActiveRoute={isActiveRoute}
        onNavigate={handleNavigation}
        onLogout={handleLogout}
        isLoggingOut={logoutMutation.isPending}
        shouldReduceMotion={shouldReduceMotion ?? false}
      />
    </>
  );
};

export default Navbar;

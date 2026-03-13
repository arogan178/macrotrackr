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
  ReportingIcon2,
  SettingsIcon,
} from "@/components/ui/Icons";
import { useLogout } from "@/hooks/auth/useAuthQueries";

import LogoButton from "./LogoButton";

// Static nav items configuration - defined outside component
const NAV_ITEMS_CONFIG = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/reporting", label: "Analytics", icon: ReportingIcon2 },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const navButtonClasses =
  "inline-flex min-h-11 cursor-pointer items-center rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const mobileMenuButtonClasses =
  "flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const iconButtonClasses =
  "inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors duration-200 hover:bg-surface hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const logoutMutation = useLogout();

  // Use useCallback for event handlers to prevent recreating on every render
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

  // Memoize nav items to prevent recreating array on every render
  const navItems = useMemo(() => NAV_ITEMS_CONFIG, []);

  const isActiveRoute = useCallback(
    (path: string) => location.pathname.startsWith(path),
    [location.pathname],
  );

  return (
    <>
      <header className="fixed inset-x-0 top-4 z-50 px-4 sm:px-6 lg:px-8">
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
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = isActiveRoute(path);

                return (
                  <button
                    key={path}
                    type="button"
                    onClick={() => handleNavigation(path)}
                    aria-current={isActive ? "page" : undefined}
                    className={`${navButtonClasses} ${
                      isActive
                        ? "bg-surface text-foreground shadow-sm"
                        : "text-muted hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                );
              })}
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
                  "min-h-11 rounded-full font-medium",
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
              className={`${iconButtonClasses} lg:hidden`}
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

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-20" />

      {/* Mobile menu overlay and menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              style={{ touchAction: "none", overscrollBehavior: "contain" }}
            />

            <motion.div
              className="fixed inset-x-4 top-20 z-50 rounded-2xl border border-border bg-surface p-3 shadow-modal lg:hidden"
              initial={shouldReduceMotion ? false : { opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.15,
                ease: "easeOut",
              }}
            >
              <div className="space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => {
                  const isActive = isActiveRoute(path);

                  return (
                    <button
                      key={path}
                      type="button"
                      onClick={() => handleNavigation(path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`${mobileMenuButtonClasses} ${
                        isActive
                          ? "bg-surface text-foreground shadow-sm"
                          : "text-muted hover:bg-surface hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </button>
                  );
                })}

                <div className="mt-2 border-t border-border pt-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className={`${mobileMenuButtonClasses} text-muted hover:bg-surface hover:text-foreground`}
                  >
                    <LogoutIcon className="h-4 w-4 shrink-0" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

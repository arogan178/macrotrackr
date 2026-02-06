import { useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useCallback,useMemo, useState } from "react";

import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { CloseIcon, GoalsIcon, HomeIcon, LogoutIcon, MenuIcon, ReportingIcon2, SettingsIcon } from "@/components/ui/Icons";
import { useLogout } from "@/hooks/auth/useAuthQueries";

import LogoButton from "./LogoButton";

// Static nav items configuration - defined outside component
const NAV_ITEMS_CONFIG = [
  { path: "/home", label: "Home", icon: HomeIcon },
  { path: "/goals", label: "Goals", icon: GoalsIcon },
  { path: "/reporting", label: "Reporting", icon: ReportingIcon2 },
  { path: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutMutation = useLogout();
  
  // Use useCallback for event handlers to prevent recreating on every render
  const handleLogout = useCallback(() => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  }, [logoutMutation]);

  const handleNavigation = useCallback((path: string) => {
    navigate({ to: path });
    setIsMobileMenuOpen(false);
  }, [navigate]);

  // Memoize nav items to prevent recreating array on every render
  const navItems = useMemo(() => NAV_ITEMS_CONFIG, []);

  return (
    <>
      <nav
        className="fixed top-0 right-0 left-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm"
        role="navigation"
        aria-label="Main navigation"
        style={{ touchAction: "manipulation" }}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-1">
            <LogoButton
              onClick={() =>
                navigate({
                  to: "/home",
                  search: { limit: 20, offset: 0 },
                })
              }
            />

            {/* Desktop menu */}
            <div className="hidden items-center gap-1 lg:flex">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Button
                  key={path}
                  onClick={() => handleNavigation(path)}
                  ariaLabel={label}
                  buttonSize="sm"
                  variant={location.pathname === path ? "primary" : "ghost"}
                  aria-current={location.pathname === path ? "page" : undefined}
                  icon={<Icon />}
                  iconPosition="left"
                >
                  <span>{label}</span>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop logout button */}
            <div className="hidden lg:flex">
              <Button
                onClick={handleLogout}
                ariaLabel="Logout"
                variant="ghost"
                buttonSize="sm"
                icon={<LogoutIcon />}
                iconPosition="left"
              >
                <span>Logout</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <motion.div
              whileTap={{ scale: 0.95 }}
              style={{ display: "inline-block" }}
            >
              <IconButton
                variant="custom"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                ariaLabel={isMobileMenuOpen ? "Close menu" : "Open menu"}
                icon={
                  isMobileMenuOpen ? (
                    <CloseIcon className="h-6 w-6" />
                  ) : (
                    <MenuIcon className="h-6 w-6" />
                  )
                }
                className="rounded-lg p-2 lg:hidden"
              />
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-16" />

      {/* Mobile menu overlay and menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <>
            {/* Mobile menu overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ touchAction: "none", overscrollBehavior: "contain" }}
            />

            {/* Mobile menu */}
            <motion.div
              className="fixed top-16 right-0 left-0 z-50 border-b border-border bg-surface p-3 lg:hidden"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="space-y-1">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    ariaLabel={label}
                    className="w-full justify-start"
                    variant={location.pathname === path ? "primary" : "ghost"}
                    aria-current={
                      location.pathname === path ? "page" : undefined
                    }
                    icon={<Icon />}
                    iconPosition="left"
                  >
                    <span>{label}</span>
                  </Button>
                ))}

                {/* Mobile logout button */}
                <div className="border-t border-border pt-2 mt-1">
                  <Button
                    onClick={handleLogout}
                    ariaLabel="Logout"
                    className="w-full justify-start"
                    variant="ghost"
                    icon={<LogoutIcon />}
                    iconPosition="left"
                  >
                    <span>Logout</span>
                  </Button>
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

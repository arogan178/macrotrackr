import { useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

import {
  Button,
  CloseIcon,
  GoalsIcon,
  HomeIcon,
  IconButton,
  LogoutIcon,
  MenuIcon,
  ReportingIcon2,
  SettingsIcon,
} from "@/components/ui";
import { useLogout } from "@/hooks/auth/useAuthQueries";

import LogoButton from "./LogoButton";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logoutMutation = useLogout();
  const handleLogout = () => {
    logoutMutation.mutate();
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate({ to: path });
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: "/home", label: "Home", icon: HomeIcon },
    { path: "/goals", label: "Goals", icon: GoalsIcon },
    { path: "/reporting", label: "Reporting", icon: ReportingIcon2 },
    { path: "/settings", label: "Settings", icon: SettingsIcon },
  ];

  return (
    <>
      <nav
        className="fixed top-0 right-0 left-0 z-50 flex h-20 items-center justify-between border-b border-border/50 bg-surface p-4 shadow-primary backdrop-blur-sm"
        role="navigation"
        aria-label="Main navigation"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div className="flex items-center">
          <LogoButton
            onClick={() =>
              navigate({
                to: "/home",
                search: { limit: 20, offset: 0 },
              })
            }
          />

          {/* Desktop menu */}
          <div className="hidden items-center space-x-2 lg:flex">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                onClick={() => handleNavigation(path)}
                ariaLabel={label}
                className="!text-lg"
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
        <div className="flex items-center space-x-2">
          {/* Desktop logout button */}
          <div className="hidden lg:flex">
            <Button
              onClick={handleLogout}
              ariaLabel="Logout"
              variant="danger"
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
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-20" />

      {/* Mobile menu overlay and menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <>
            {/* Mobile menu overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ touchAction: "none", overscrollBehavior: "none" }}
            />

            {/* Mobile menu */}
            <motion.div
              className="fixed top-20 right-0 left-0 z-50 border-b border-border/50 bg-surface/95 p-4 shadow-primary backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex-1 space-y-3 md:space-y-2">
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
                <Button
                  onClick={handleLogout}
                  ariaLabel="Logout"
                  className="w-full justify-start"
                  variant="danger"
                  icon={<LogoutIcon className="mr-3" />}
                  iconPosition="left"
                >
                  <span>Logout</span>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

import { useLocation, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import React, { useState } from "react";

import {
  Button,
  CloseIcon,
  GoalsIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  ReportingIcon2,
  SettingsIcon,
} from "@/components/ui";
import { useLogout } from "@/hooks/auth/useAuthQueries";

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

  const getButtonClass = (path: string, isMobile = false) => {
    const isActive = location.pathname === path;
    const baseClass = isMobile
      ? "w-full px-4 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-start text-left focus:outline-none focus:ring-2 focus:ring-primary"
      : "px-3 py-2 font-medium rounded-lg transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-gray-800";

    return `${baseClass} ${
      isActive
        ? "bg-gradient-to-r from-primary/90 to-primary/90 text-foreground shadow-primary shadow-primary/20"
        : "text-foreground hover:bg-surface/50 hover:text-foreground"
    }`;
  };
  return (
    <>
      <nav
        className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between border-b border-border/50 bg-surface/95 p-3 shadow-primary backdrop-blur-sm"
        role="navigation"
        aria-label="Main navigation"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div className="flex items-center">
          <Button
            onClick={() => navigate({ to: "/home" })}
            ariaLabel="Go to home page"
            className="mr-2 bg-gradient-to-r from-primary to-primary bg-clip-text text-lg font-bold text-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 sm:mr-4 sm:text-xl "
            variant="ghost"
          >
            MacroTrackr
          </Button>

          {/* Desktop menu */}
          <div className="hidden items-center space-x-2 md:flex">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Button
                key={path}
                onClick={() => handleNavigation(path)}
                ariaLabel={label}
                className={`${getButtonClass(path)}, !text-lg `}
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
          <div className="hidden md:flex">
            <Button
              onClick={handleLogout}
              ariaLabel="Logout"
              className="items-center rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 font-medium text-foreground shadow-primary shadow-red-600/20 transition-all duration-200 hover:from-red-500 hover:to-red-400 hover:shadow-red-500/30 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none "
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
            <Button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              ariaLabel={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="rounded-lg p-2 text-foreground transition-all duration-200 hover:bg-surface/50 hover:text-foreground focus:ring-2 focus:ring-primary focus:outline-none md:hidden "
              variant="ghost"
              icon={
                isMobileMenuOpen ? (
                  <CloseIcon className="h-6 w-6" />
                ) : (
                  <MenuIcon className="h-6 w-6" />
                )
              }
              iconPosition="left"
              style={{ touchAction: "manipulation", userSelect: "none" }}
            />
          </motion.div>
        </div>{" "}
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-[60px]" />

      {/* Mobile menu overlay and menu */}
      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <>
            {/* Mobile menu overlay */}
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
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
              className="fixed top-[73px] right-0 left-0 z-50 border-b border-border/50 bg-surface/95 shadow-primary backdrop-blur-sm md:hidden"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="space-y-2 p-4">
                {navItems.map(({ path, label, icon: Icon }) => (
                  <Button
                    key={path}
                    onClick={() => handleNavigation(path)}
                    ariaLabel={label}
                    className={`${getButtonClass(path, true)} `}
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
                  className="flex w-full items-center justify-start rounded-lg bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 font-medium text-foreground shadow-primary shadow-red-600/20 transition-all duration-200 hover:from-red-500 hover:to-red-400 hover:shadow-red-500/30 focus:ring-2 focus:ring-red-500 focus:outline-none "
                  variant="danger"
                  icon={<LogoutIcon className="mr-3 h-5 w-5" />}
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

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
      ? "w-full px-4 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-start text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
      : "px-3 py-2 font-medium rounded-lg transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800";

    return `${baseClass} ${
      isActive
        ? "bg-gradient-to-r from-indigo-600/90 to-blue-500/90 text-white shadow-lg shadow-indigo-500/20"
        : "text-gray-200 hover:bg-gray-700/50 hover:text-white"
    }`;
  };
  return (
    <>
      <nav
        className="p-3 flex justify-between items-center fixed top-0 left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg"
        role="navigation"
        aria-label="Main navigation"
        style={{ touchAction: "none", overscrollBehavior: "none" }}
      >
        <div className="flex items-center">
          <Button
            onClick={() => navigate({ to: "/home" })}
            ariaLabel="Go to home page"
            className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 text-transparent bg-clip-text mr-2 sm:mr-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 "
            variant="ghost"
          >
            MacroTrackr
          </Button>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2">
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
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 items-center shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 "
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
              className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 "
              variant="ghost"
              icon={
                isMobileMenuOpen ? (
                  <CloseIcon className="w-6 h-6" />
                ) : (
                  <MenuIcon className="w-6 h-6" />
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
              className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
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
              className="md:hidden fixed top-[73px] left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg"
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="p-4 space-y-2">
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
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 flex items-center justify-start shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 "
                  variant="danger"
                  icon={<LogoutIcon className="w-5 h-5 mr-3" />}
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

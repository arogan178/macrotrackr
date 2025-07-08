import React, { useState } from "react";
import FormButton from "./form/FormButton";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "@/store/store";
import { AnimatePresence, motion } from "motion/react";
import {
  HomeIcon,
  ReportingIcon2,
  SettingsIcon,
  LogoutIcon,
  GoalsIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/Icons";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const logout = useStore((state) => state.logout);
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    setIsMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
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
          <FormButton
            onClick={() => handleNavigation("/home")}
            ariaLabel="Go to home page"
            className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 text-transparent bg-clip-text mr-2 sm:mr-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 "
            variant="ghost"
            size="md"
          >
            MacroTrackr
          </FormButton>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <FormButton
                key={path}
                onClick={() => handleNavigation(path)}
                ariaLabel={label}
                className={`${getButtonClass(path)}, !text-lg `}
                variant={location.pathname === path ? "primary" : "ghost"}
                size="md"
                aria-current={location.pathname === path ? "page" : undefined}
                icon={<Icon />}
                iconPosition="left"
              >
                <span>{label}</span>
              </FormButton>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Desktop logout button */}
          <div className="hidden md:flex">
            <FormButton
              onClick={handleLogout}
              ariaLabel="Logout"
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 items-center shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800 "
              variant="danger"
              size="md"
              icon={<LogoutIcon />}
              iconPosition="left"
            >
              <span>Logout</span>
            </FormButton>
          </div>

          {/* Mobile menu button */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            style={{ display: "inline-block" }}
          >
            <FormButton
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              ariaLabel={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 "
              variant="ghost"
              size="md"
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
      <div className="h-[73px]" />

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
                  <FormButton
                    key={path}
                    onClick={() => handleNavigation(path)}
                    ariaLabel={label}
                    className={`${getButtonClass(path, true)} `}
                    variant={location.pathname === path ? "primary" : "ghost"}
                    size="md"
                    aria-current={
                      location.pathname === path ? "page" : undefined
                    }
                    icon={<Icon />}
                    iconPosition="left"
                  >
                    <span>{label}</span>
                  </FormButton>
                ))}

                {/* Mobile logout button */}
                <FormButton
                  onClick={handleLogout}
                  ariaLabel="Logout"
                  className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 flex items-center justify-start shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 "
                  variant="danger"
                  size="md"
                  icon={<LogoutIcon className="w-5 h-5 mr-3" />}
                  iconPosition="left"
                >
                  <span>Logout</span>
                </FormButton>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

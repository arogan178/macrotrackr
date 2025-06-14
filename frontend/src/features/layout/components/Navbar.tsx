import React, { useMemo, useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ReportingIcon2,
  SettingsIcon,
  LogoutIcon,
  GoalsIcon,
  MenuIcon,
  CloseIcon,
} from "@/components/Icons";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const handleNavigation = useCallback(
    (path: string) => () => {
      navigate(path);
      setIsMobileMenuOpen(false);
    },
    [navigate]
  );

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        path: "/home",
        label: "Home",
        icon: HomeIcon,
        onClick: handleNavigation("/home"),
      },
      {
        path: "/goals",
        label: "Goals",
        icon: GoalsIcon,
        onClick: handleNavigation("/goals"),
      },
      {
        path: "/reporting",
        label: "Reporting",
        icon: ReportingIcon2,
        onClick: handleNavigation("/reporting"),
      },
      {
        path: "/settings",
        label: "Settings",
        icon: SettingsIcon,
        onClick: handleNavigation("/settings"),
      },
    ],
    [handleNavigation]
  );
  const getButtonClass = useCallback(
    (path: string, isMobile: boolean = false) => {
      const baseClass = isMobile
        ? "w-full px-4 py-3 font-medium rounded-lg transition-all duration-200 flex items-center justify-start text-left focus:outline-none focus:ring-2 focus:ring-indigo-500"
        : "px-3 py-2 font-medium rounded-lg transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800";
      const isActive = location.pathname === path;
      return `${baseClass} ${
        isActive
          ? "bg-gradient-to-r from-indigo-600/90 to-blue-500/90 text-white shadow-lg shadow-indigo-500/20"
          : "text-gray-200 hover:bg-gray-700/50 hover:text-white"
      }`;
    },
    [location.pathname]
  );

  return (
    <>
      <nav
        className="p-3 flex justify-between items-center sticky top-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="flex items-center">
          <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 text-transparent bg-clip-text mr-2 sm:mr-4">
            HealthyLife
          </span>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map(({ path, label, icon: Icon, onClick }) => (
              <button
                key={path}
                className={getButtonClass(path)}
                onClick={onClick}
                aria-current={location.pathname === path ? "page" : undefined}
              >
                <Icon className="w-5 h-5 mr-2" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Desktop logout button */}
          <button
            className="hidden md:flex px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 items-center shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogoutIcon className="w-5 h-5 mr-2" />
            <span>Logout</span>
          </button>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-200 hover:bg-gray-700/50 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={toggleMobileMenu}
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <CloseIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile menu */}
      <div
        className={`md:hidden fixed top-[73px] left-0 right-0 z-50 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? "transform translate-y-0 opacity-100"
            : "transform -translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="p-4 space-y-2">
          {navItems.map(({ path, label, icon: Icon, onClick }) => (
            <button
              key={path}
              className={getButtonClass(path, true)}
              onClick={onClick}
              aria-current={location.pathname === path ? "page" : undefined}
            >
              <Icon className="w-5 h-5 mr-3" />
              <span>{label}</span>
            </button>
          ))}

          {/* Mobile logout button */}
          <button
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 flex items-center justify-start shadow-lg shadow-red-600/20 hover:shadow-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500"
            onClick={handleLogout}
            aria-label="Logout"
          >
            <LogoutIcon className="w-5 h-5 mr-3" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Navbar;

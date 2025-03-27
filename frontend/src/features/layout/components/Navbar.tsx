import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  HomeIcon,
  ReportingIcon2,
  SettingsIcon,
  LogoutIcon,
} from "@/components/Icons";

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleHome = () => {
    navigate("/home");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleReporting = () => {
    navigate("/reporting");
  };

  const getButtonClass = (path: string) => {
    const baseClass =
      "px-4 py-1.5 font-medium rounded-lg transition-all duration-200 flex items-center";
    const isActive = location.pathname === path;
    return `${baseClass} ${
      isActive
        ? "bg-gradient-to-r from-indigo-600/90 to-blue-500/90 text-white shadow-lg shadow-indigo-500/20"
        : "text-gray-200 hover:bg-gray-700/50 hover:text-white"
    }`;
  };

  return (
    <nav className="p-3 flex justify-between items-center sticky top-0 z-999 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 shadow-lg">
      <div className="flex items-center">
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-blue-400 text-transparent bg-clip-text mr-4">
          HealthyLife
        </span>
        <div className="flex items-center space-x-2 mt-0.5">
          <button className={getButtonClass("/home")} onClick={handleHome}>
            <HomeIcon className="w-5 h-5 mr-2" />
            Home
          </button>
          <button
            className={getButtonClass("/reporting")}
            onClick={handleReporting}
          >
            <ReportingIcon2 className="w-5 h-5 mr-2" />
            Reporting
          </button>
          <button
            className={getButtonClass("/settings")}
            onClick={handleSettings}
          >
            <SettingsIcon className="w-5 h-5 mr-2" />
            Settings
          </button>
        </div>
      </div>
      <div>
        <button
          className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white font-medium rounded-lg hover:from-red-500 hover:to-red-400 transition-all duration-200 flex items-center shadow-lg shadow-red-600/20 hover:shadow-red-500/30"
          onClick={handleLogout}
        >
          <LogoutIcon className="w-5 h-5 mr-2" />
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

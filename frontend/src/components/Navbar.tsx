import React from "react";

const Navbar: React.FC = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleHome = () => {
    window.location.href = "/home";
  };

  const handleSettings = () => {
    window.location.href = "/settings";
  };

  return (
    <nav className="p-4 flex justify-between items-center sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        <button
          className="text-white font-bold hover:text-gray-300"
          onClick={handleHome}
        >
          Home
        </button>
      </div>
      <div>
        <button
          className="text-white font-bold hover:text-gray-300 pr-4"
          onClick={handleSettings}
        >
          Settings
        </button>
        <button
          className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          onClick={handleLogout}
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

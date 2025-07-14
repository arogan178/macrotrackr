import React from "react";

import { useStore } from "@/store/store";

import Navbar from "./Navbar";

const MainLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useStore((state) => state.auth.isAuthenticated);
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {isAuthenticated && <Navbar />}
      <main>{children}</main>
    </div>
  );
};

export default MainLayout;

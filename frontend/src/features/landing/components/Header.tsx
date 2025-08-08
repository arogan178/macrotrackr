import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button } from "@/components/ui";
import LogoButton from "@/components/layout/LogoButton";

const Header: React.FC = () => (
  <header className="relative z-10 border-b border-border/50 bg-surface backdrop-blur-xl supports-[backdrop-filter]:bg-surface">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-6">
        <LogoButton className="h-0" />
        <div className="flex items-center space-x-4">
          <Link to="/login" className="inline-block">
            <Button text="Log In" variant="primary" buttonSize="md" />
          </Link>
          <Link to="/register" className="inline-block">
            <Button text="Sign Up" variant="primary" buttonSize="md" />
          </Link>
        </div>
      </div>
    </div>
  </header>
);

export default Header;

import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button } from "@/components/ui";

const Header: React.FC = () => (
  <header className="relative z-10 border-b border-border/50 bg-surface backdrop-blur-xl supports-[backdrop-filter]:bg-surface">
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between py-6">
        <motion.div
          className="flex items-center"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 350, damping: 26 }}
        >
          <h1 className="text-3xl font-bold text-foreground">MacroTrackr</h1>
        </motion.div>
        <div className="flex items-center space-x-3">
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

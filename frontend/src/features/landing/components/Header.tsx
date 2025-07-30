import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import React from "react";

import { Button } from "@/components/ui";

const Header: React.FC = () => (
  <header className="relative z-10 border-b border-border/50 backdrop-blur-xl bg-surface/80 supports-[backdrop-filter]:bg-surface/60">
    <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-6">
        <motion.div
          className="flex items-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-primary text-transparent bg-clip-text pb-1">
            MacroTrackr
          </h1>
        </motion.div>
        <div className="flex items-center space-x-4">
          <Link to="/login" className="inline-block">
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Button
                text="Log In"
                variant="primary"
                className="bg-primary hover:bg-primary shadow-primary transition-all duration-300"
              />
            </motion.div>
          </Link>
          <Link to="/register" className="inline-block">
            <motion.div
              whileHover={{
                scale: 1.05,
                boxShadow: "0 10px 25px rgba(79, 70, 229, 0.3)",
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <Button
                text="Sign Up"
                variant="primary"
                className="bg-primary hover:bg-primary shadow-primary transition-all duration-300"
              />
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  </header>
);

export default Header;

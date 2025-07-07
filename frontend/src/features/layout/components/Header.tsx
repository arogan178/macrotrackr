import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import FormButton from "@/components/form/FormButton";
import { BUTTON_VARIANTS, BUTTON_SIZES } from "@/components/utils/constants";

const Header: React.FC = () => (
  <header className="relative z-10 border-b border-slate-800/50 backdrop-blur-xl bg-slate-900/80 supports-[backdrop-filter]:bg-slate-900/60">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-6">
        <motion.div
          className="flex items-center"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 text-transparent bg-clip-text pb-1">
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
              <FormButton
                text="Log In"
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.MD}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all duration-300"
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
              <FormButton
                text="Sign Up"
                variant={BUTTON_VARIANTS.PRIMARY}
                size={BUTTON_SIZES.MD}
                className="bg-indigo-600 hover:bg-indigo-700 shadow-lg transition-all duration-300"
              />
            </motion.div>
          </Link>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
